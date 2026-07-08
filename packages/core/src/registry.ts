import type { Lab, ModelInfo } from "./types.js";

/**
 * The cross-lab model registry — the single source of truth every tool reads.
 *
 * ⚠️  PRICING + LIMITS ARE EXAMPLE VALUES AND WILL BE STALE.
 * Do not trust these numbers in production. Verify against each lab's
 * official pricing page and update `verified`. Day 4's "live model
 * reference" tool is designed to automate refreshing this file.
 *
 * The point of shipping it with placeholders is that the *shape* is correct
 * and every downstream tool can rely on it today.
 */
export const MODELS: readonly ModelInfo[] = [
  {
    id: "gpt-4o",
    lab: "openai",
    label: "GPT-4o",
    contextWindow: 128_000,
    maxOutput: 16_384,
    pricing: { inputPerMTok: 2.5, outputPerMTok: 10 },
    verified: "2026-01-01",
  },
  {
    id: "gpt-4o-mini",
    lab: "openai",
    label: "GPT-4o mini",
    contextWindow: 128_000,
    maxOutput: 16_384,
    pricing: { inputPerMTok: 0.15, outputPerMTok: 0.6 },
    verified: "2026-01-01",
  },
  {
    id: "claude-sonnet-4",
    lab: "anthropic",
    label: "Claude Sonnet 4",
    contextWindow: 200_000,
    maxOutput: 64_000,
    pricing: { inputPerMTok: 3, outputPerMTok: 15 },
    verified: "2026-01-01",
  },
  {
    id: "gemini-2.0-flash",
    lab: "google",
    label: "Gemini 2.0 Flash",
    contextWindow: 1_000_000,
    maxOutput: 8_192,
    pricing: { inputPerMTok: 0.1, outputPerMTok: 0.4 },
    verified: "2026-01-01",
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
