#!/usr/bin/env node
import { cli } from "@labkit/core";
import { compare, hasStalePricing } from "./index.js";

/**
 * CLI entry. Uses the shared router from @labkit/core so this tool has the
 * same UX (--json, --help) as every other tool in the series.
 *
 * Usage:
 *   token-cost estimate "your prompt here" --output 500
 *   token-cost estimate "your prompt" --json
 */

const estimate: cli.Command = {
  name: "estimate",
  summary: "Compare token count + cost for a string across all labs",
  run({ args, flags }) {
    const text = args.join(" ");
    if (!text) {
      console.error('Provide text: token-cost estimate "your prompt"');
      process.exitCode = 1;
      return;
    }
    const outputTokens = typeof flags.output === "string" ? Number.parseInt(flags.output, 10) : 0;
    const results = compare(text, { outputTokens });

    if (flags.json) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    console.log(`\nInput: ${text.length} chars\n`);
    console.log("Model                 In tok   Out tok   Total $");
    console.log("-".repeat(52));
    for (const r of results) {
      const label = r.model.label.padEnd(20);
      const inTok = String(r.inputTokens).padStart(7);
      const outTok = String(r.outputTokens).padStart(8);
      const cost = `$${r.totalCost.toFixed(5)}`.padStart(10);
      console.log(`${label} ${inTok} ${outTok} ${cost}`);
    }
    if (hasStalePricing(results)) {
      console.log("\n⚠️  Some pricing data is stale — verify before trusting costs.");
    }
    console.log("\nNote: counts use an approximate tokenizer. Wire in real ones for exact values.");
  },
};

await cli.run(
  {
    name: "token-cost",
    description: "Cross-lab token + cost comparator",
    commands: [estimate],
  },
  process.argv.slice(2),
);
