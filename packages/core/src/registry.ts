import type { Lab, ModelInfo } from "./types.js";

/**
 * The cross-lab model registry — the single source of truth every tool reads.
 *
 * Pricing verified 2026-07-09 against each lab's official pages:
 * - OpenAI:    https://developers.openai.com/api/docs/pricing
 * - Google:    https://ai.google.dev/gemini-api/docs/pricing
 * - Anthropic: https://platform.claude.com/docs/en/about-claude/pricing.md
 *
 * All prices are USD per 1M tokens, standard tier (no batch/cache discounts).
 * Pricing and limits change often — `isStale()` warns when `verified` is
 * older than 30 days. Day 4's "live model reference" tool automates refresh.
 */
export const MODELS: readonly ModelInfo[] = [
  // ─── OpenAI ────────────────────────────────────────────────────────────
  {
    id: "gpt-5.5",
    lab: "openai",
    label: "GPT-5.5",
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    pricing: { inputPerMTok: 5, outputPerMTok: 30 },
    verified: "2026-07-09",
  },
  {
    id: "gpt-5.4",
    lab: "openai",
    label: "GPT-5.4",
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    pricing: { inputPerMTok: 2.5, outputPerMTok: 15 },
    verified: "2026-07-09",
  },
  {
    id: "gpt-5.4-mini",
    lab: "openai",
    label: "GPT-5.4 mini",
    contextWindow: 400_000,
    maxOutput: 128_000,
    pricing: { inputPerMTok: 0.75, outputPerMTok: 4.5 },
    verified: "2026-07-09",
  },
  // ─── Anthropic ─────────────────────────────────────────────────────────
  {
    id: "claude-opus-4-8",
    lab: "anthropic",
    label: "Claude Opus 4.8",
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    pricing: { inputPerMTok: 5, outputPerMTok: 25 },
    verified: "2026-07-09",
  },
  {
    // Standard sticker price; introductory $2/$10 applies through 2026-08-31.
    id: "claude-sonnet-5",
    lab: "anthropic",
    label: "Claude Sonnet 5",
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    pricing: { inputPerMTok: 3, outputPerMTok: 15 },
    verified: "2026-07-09",
  },
  {
    id: "claude-haiku-4-5",
    lab: "anthropic",
    label: "Claude Haiku 4.5",
    contextWindow: 200_000,
    maxOutput: 64_000,
    pricing: { inputPerMTok: 1, outputPerMTok: 5 },
    verified: "2026-07-09",
  },
  // ─── Google ────────────────────────────────────────────────────────────
  {
    // Prompts <=200k tokens priced at $2/$12; the whole request jumps to
    // $4/$18 above that. Preview id — no 3.x Pro GA yet.
    id: "gemini-3.1-pro-preview",
    lab: "google",
    label: "Gemini 3.1 Pro",
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    pricing: {
      inputPerMTok: 2,
      outputPerMTok: 12,
      longContext: { thresholdTokens: 200_000, inputPerMTok: 4, outputPerMTok: 18 },
    },
    verified: "2026-07-09",
  },
  {
    id: "gemini-3.5-flash",
    lab: "google",
    label: "Gemini 3.5 Flash",
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    pricing: { inputPerMTok: 1.5, outputPerMTok: 9 },
    verified: "2026-07-09",
  },
  {
    id: "gemini-3.1-flash-lite",
    lab: "google",
    label: "Gemini 3.1 Flash-Lite",
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    pricing: { inputPerMTok: 0.25, outputPerMTok: 1.5 },
    verified: "2026-07-09",
  },
];

export function getModel(id: string): ModelInfo | undefined {
  return MODELS.find((m) => m.id === id);
}

export function modelsByLab(lab: Lab): readonly ModelInfo[] {
  return MODELS.filter((m) => m.lab === lab);
}

/** Warn if a model's pricing data is older than `maxAgeDays`. */
export function isStale(model: ModelInfo, maxAgeDays = 30): boolean {
  const ageMs = Date.now() - new Date(model.verified).getTime();
  return ageMs > maxAgeDays * 24 * 60 * 60 * 1000;
}
