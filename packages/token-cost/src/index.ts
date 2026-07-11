import {
  type CostEstimate,
  type Lab,
  MODELS,
  type ModelInfo,
  type Tokenizer,
  isStale,
} from "labkit-core";
import { defaultTokenizers } from "./tokenizers.js";

export {
  anthropicTokenizer,
  defaultTokenizers,
  googleTokenizer,
  openaiTokenizer,
  openTokenizer,
  resolveTokenizers,
  xaiTokenizer,
  type ResolveOptions,
} from "./tokenizers.js";

/**
 * Token + cost comparator across labs.
 *
 * Counts default to the best available per-lab tokenizer (see tokenizers.ts):
 * exact for OpenAI (tiktoken), honest labelled estimates for Anthropic and
 * Google, upgradeable to exact API-backed counts via `resolveTokenizers()`.
 */

/**
 * Rough approximation: ~4 characters per token. Kept as the last-resort
 * fallback and for tests; real per-lab tokenizers are the default.
 */
export const heuristicTokenizer = (lab: Lab): Tokenizer => ({
  lab,
  count: (text: string) => Math.max(1, Math.ceil(text.length / 4)),
});

/** Registry of tokenizers per lab. Entries here override the defaults. */
export type TokenizerMap = Partial<Record<Lab, Tokenizer>>;

function tokenizerFor(lab: Lab, overrides?: TokenizerMap): Tokenizer {
  return overrides?.[lab] ?? defaultTokenizers()[lab] ?? heuristicTokenizer(lab);
}

export interface EstimateOptions {
  /** Assumed output length in tokens (cost depends on it). Default 0. */
  readonly outputTokens?: number;
  /** Restrict to specific models by id. Default: all. */
  readonly models?: readonly string[];
  /** Override the default per-lab tokenizers (e.g. exact API-backed counts). */
  readonly tokenizers?: TokenizerMap;
}

/** Estimate token count + cost for one model. */
export function estimateForModel(
  text: string,
  model: ModelInfo,
  opts: EstimateOptions = {},
): CostEstimate {
  const tokenizer = tokenizerFor(model.lab, opts.tokenizers);
  const inputTokens = tokenizer.count(text);
  const outputTokens = opts.outputTokens ?? 0;
  // Pick the long-context tier when the prompt crosses the threshold (some
  // labs price the whole request at the higher rate above it).
  const { longContext } = model.pricing;
  const rates =
    longContext && inputTokens > longContext.thresholdTokens ? longContext : model.pricing;
  const inputCost = (inputTokens / 1_000_000) * rates.inputPerMTok;
  const outputCost = (outputTokens / 1_000_000) * rates.outputPerMTok;
  return {
    model,
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    exact: tokenizer.exact === true,
  };
}

/** Compare the same text across every (or a filtered set of) model, cheapest first. */
export function compare(text: string, opts: EstimateOptions = {}): CostEstimate[] {
  const pool: readonly ModelInfo[] = opts.models
    ? MODELS.filter((m: ModelInfo) => opts.models?.includes(m.id))
    : MODELS;
  return pool
    .map((m: ModelInfo): CostEstimate => estimateForModel(text, m, opts))
    .sort((a: CostEstimate, b: CostEstimate) => a.totalCost - b.totalCost);
}

/** True if any model in the comparison has stale pricing data. */
export function hasStalePricing(estimates: readonly CostEstimate[]): boolean {
  return estimates.some((e) => isStale(e.model));
}
