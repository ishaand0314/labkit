/**
 * Shared vocabulary for every labkit tool.
 * Keeping these types in one place is what lets tools interoperate:
 * the token-cost comparator, the format translator, and the model
 * reference all speak the same `Lab` and `ModelId`.
 */

/** The frontier labs we support. Add one here and every tool can see it. */
export type Lab = "openai" | "anthropic" | "google";

export const LABS: readonly Lab[] = ["openai", "anthropic", "google"] as const;

/** A model's static metadata. Prices are USD per 1M tokens. */
export interface ModelInfo {
  readonly id: string;
  readonly lab: Lab;
  /** Human label, e.g. "GPT-4o". */
  readonly label: string;
  readonly contextWindow: number;
  readonly maxOutput: number;
  readonly pricing: {
    readonly inputPerMTok: number;
    readonly outputPerMTok: number;
  };
  /**
   * Pricing/limits change often. This is the date the values were last
   * verified so tools can warn when the data is stale. Day 4's "live model
   * reference" tool is what keeps this fresh.
   */
  readonly verified: string; // ISO date
}

/** Result of a single-model token+cost estimate. */
export interface CostEstimate {
  readonly model: ModelInfo;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly inputCost: number;
  readonly outputCost: number;
  readonly totalCost: number;
}

/** A tokenizer strategy. Real tokenizers get wired in per-lab (Day 1 task). */
export interface Tokenizer {
  readonly lab: Lab;
  count(text: string): number;
}
