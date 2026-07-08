import {
  type CostEstimate,
  type Lab,
  MODELS,
  type ModelInfo,
  type Tokenizer,
  isStale,
} from "@labkit/core";

/**
 * Day 1: token + cost comparator across labs.
 *
 * WHAT'S DONE: the shape, the cross-lab comparison, cost math, CLI, tests.
 * WHAT'S YOUR BUILD TODAY: replace `heuristicTokenizer` with real per-lab
 * tokenizers (js-tiktoken for OpenAI, @anthropic-ai/tokenizer, etc.) so the
 * counts are exact rather than approximate. The interface is already here —
 * you're swapping the implementation, not restructuring.
 */

/**
 * Rough approximation: ~4 characters per token. Good enough to prove the
 * tool end-to-end; NOT accurate enough to ship. This is the seam you replace.
 */
export const heuristicTokenizer = (lab: Lab): Tokenizer => ({
  lab,
  count: (text: string) => Math.max(1, Math.ceil(text.length / 4)),
});

/** Registry of tokenizers per lab. Swap entries as you wire in real ones. */
export type TokenizerMap = Partial<Record<Lab, Tokenizer>>;

function tokenizerFor(lab: Lab, overrides?: TokenizerMap): Tokenizer {
  return overrides?.[lab] ?? heuristicTokenizer(lab);
}

export interface EstimateOptions {
  /** Assumed output length in tokens (cost depends on it). Default 0. */
  readonly outputTokens?: number;
  /** Restrict to specific models by id. Default: all. */
  readonly models?: readonly string[];
  /** Provide real tokenizers here to override the heuristic. */
  readonly tokenizers?: TokenizerMap;
}

/** Estimate token count + cost for one model. */
export function estimateForModel(
  text: string,
  model: ModelInfo,
  opts: EstimateOptions = {},
): CostEstimate {
  const inputTokens = tokenizerFor(model.lab, opts.tokenizers).count(text);
  const outputTokens = opts.outputTokens ?? 0;
  const inputCost = (inputTokens / 1_000_000) * model.pricing.inputPerMTok;
  const outputCost = (outputTokens / 1_000_000) * model.pricing.outputPerMTok;
  return {
    model,
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
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
