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
    /**
     * Some labs charge a higher rate once a prompt crosses a token threshold
     * (e.g. Gemini Pro above 200k input tokens). When the input token count
     * exceeds `thresholdTokens`, the whole request is priced at these rates.
     */
    readonly longContext?: {
      readonly thresholdTokens: number;
      readonly inputPerMTok: number;
      readonly outputPerMTok: number;
    };
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
  /** True when the count came from the lab's real tokenizer (or counting API). */
  readonly exact: boolean;
}

/** A tokenizer strategy — one real implementation per lab (see tokenizers.ts). */
export interface Tokenizer {
  readonly lab: Lab;
  /** True when counts are exact for this lab. Omitted/false = honest estimate. */
  readonly exact?: boolean;
  count(text: string): number;
}
