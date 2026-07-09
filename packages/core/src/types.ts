/**
 * Shared vocabulary for every labkit tool.
 * Keeping these types in one place is what lets tools interoperate:
 * the token-cost comparator, the format translator, and the model
 * reference all speak the same `Lab` and `ModelId`.
 */

/**
 * The model providers we support. Add one here and every tool can see it.
 * `openai`, `anthropic`, `google`, and `xai` are first-party closed labs.
 * `open` is a virtual "lab" for open-weight models (Llama, DeepSeek, Qwen,
 * Mistral, GLM…) priced at a representative hosted provider's rates.
 */
export type Lab = "openai" | "anthropic" | "google" | "xai" | "open";

export const LABS: readonly Lab[] = ["openai", "anthropic", "google", "xai", "open"] as const;

/** A model's static metadata. Prices are USD per 1M tokens. */
export interface ModelInfo {
  readonly id: string;
  readonly lab: Lab;
  /** Human label, e.g. "GPT-4o". */
  readonly label: string;
  readonly contextWindow: number;
  readonly maxOutput: number;
  /**
   * Which hosted provider the pricing is quoted from. Meaningful for
   * open-weight models (`lab: "open"`), where the same weights are served by
   * many hosts at different prices; omitted for a lab's first-party models.
   */
  readonly provider?: string;
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
   * Short, concrete known limitations, so "cheaper" doesn't silently mean
   * "worse for your task". Each string is one caveat an engineer should weigh
   * before picking this model (e.g. "weaker at long-context recall past ~128k",
   * "no vision", "verbose without a strict system prompt"). Empty/omitted =
   * no notable caveats recorded.
   */
  readonly limitations?: readonly string[];
  /**
   * Pricing/limits change often. This is the date the values were last
   * verified, so `isStale()` can warn when the data is getting old.
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

/** A tokenizer strategy: one real implementation per lab (see tokenizers.ts). */
export interface Tokenizer {
  readonly lab: Lab;
  /** True when counts are exact for this lab. Omitted/false = honest estimate. */
  readonly exact?: boolean;
  count(text: string): number;
}
