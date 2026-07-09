#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { cli } from "@labkit/core";
import { compare, hasStalePricing, resolveTokenizers } from "./index.js";

/**
 * CLI entry. Uses the shared router from @labkit/core so this tool has the
 * same UX (--json, --help) as every other tool in the series.
 *
 * Usage:
 *   token-cost estimate "your prompt here" --output 500
 *   token-cost estimate --file prompt.txt
 *   cat prompt.txt | token-cost estimate
 *   token-cost estimate "your prompt" --json
 *
 * Counts: OpenAI is exact (tiktoken). Anthropic/Google are labelled estimates,
 * upgraded to exact automatically when ANTHROPIC_API_KEY / GEMINI_API_KEY are set.
 */

/** Thrown for bad user input; caught in run() to print a one-line error. */
class UsageError extends Error {}

function readText(args: string[], flags: Record<string, string | boolean>): string {
  if (flags.file !== undefined) {
    if (typeof flags.file !== "string") {
      throw new UsageError("--file requires a filename, e.g. --file prompt.txt");
    }
    try {
      return readFileSync(flags.file, "utf8");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new UsageError(`Cannot read --file "${flags.file}": ${msg}`);
    }
  }
  const positional = args.join(" ");
  if (positional) return positional;
  if (!process.stdin.isTTY) {
    // Piped input: `cat prompt.txt | token-cost estimate`
    return readFileSync(0, "utf8");
  }
  return "";
}

/** Parse --output into a non-negative integer, or throw a UsageError. */
function parseOutputTokens(value: string | boolean | undefined): number {
  if (value === undefined) return 0;
  if (typeof value !== "string") {
    throw new UsageError("--output requires a token count, e.g. --output 500");
  }
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n < 0) {
    throw new UsageError(`--output must be a non-negative integer (got "${value}")`);
  }
  return n;
}

function money(value: number): string {
  return `$${value.toFixed(5)}`;
}

const estimate: cli.Command = {
  name: "estimate",
  summary: "Compare token count + cost for a string across all labs",
  async run({ args, flags }) {
    let text: string;
    let outputTokens: number;
    try {
      text = readText(args, flags).trim();
      outputTokens = parseOutputTokens(flags.output);
    } catch (err) {
      if (err instanceof UsageError) {
        console.error(err.message);
        process.exitCode = 1;
        return;
      }
      throw err;
    }
    if (!text) {
      console.error(
        'Provide text: token-cost estimate "your prompt" (or --file prompt.txt, or pipe stdin)',
      );
      process.exitCode = 1;
      return;
    }
    const tokenizers = await resolveTokenizers(text);
    const results = compare(text, { outputTokens, tokenizers });

    if (flags.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    const cheapest = results[0];
    const priciest = results[results.length - 1];
    const anyEstimate = results.some((r) => !r.exact);

    const header = `${"Model".padEnd(23)}${"In tok".padStart(7)}${"Out tok".padStart(9)}${"Total".padStart(11)}`;
    console.log(`\nInput: ${text.length} chars, output assumption: ${outputTokens} tok\n`);
    console.log(header);
    console.log("─".repeat(header.length + 11));
    for (const r of results) {
      const label = r.model.label.padEnd(23);
      const inTok = `${r.inputTokens}${r.exact ? "" : "*"}`.padStart(7);
      const outTok = String(r.outputTokens).padStart(9);
      const cost = money(r.totalCost).padStart(11);
      const marker = r === cheapest ? "  ← cheapest" : "";
      console.log(`${label}${inTok}${outTok}${cost}${marker}`);
    }

    if (cheapest && priciest && priciest.totalCost > 0 && cheapest.totalCost > 0) {
      const ratio = priciest.totalCost / cheapest.totalCost;
      if (ratio >= 1.05) {
        console.log(
          `\n${cheapest.model.label} is ${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× cheaper than ${priciest.model.label} for this prompt.`,
        );
      }
    }
    if (anyEstimate) {
      console.log("\n* estimated count — set ANTHROPIC_API_KEY / GEMINI_API_KEY for exact counts.");
    }
    if (hasStalePricing(results)) {
      console.log("\n⚠️  Some pricing data is stale — verify before trusting costs.");
    }
  },
};

await cli.run(
  {
    name: "token-cost",
    description: "Cross-lab token + cost comparator",
    commands: [estimate],
    booleanFlags: ["json"],
  },
  process.argv.slice(2),
);
