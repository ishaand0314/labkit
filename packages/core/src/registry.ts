import type { Lab, ModelInfo } from "./types.js";

/**
 * The cross-lab model registry: the single source of truth every tool reads.
 *
 * Closed-lab pricing verified 2026-07-09; open-weight and newly-added frontier
 * models verified 2026-07-10, against each source below:
 * - OpenAI:    https://developers.openai.com/api/docs/pricing
 * - Anthropic: bundled claude-api skill (shared/models.md, cached 2026-06-24)
 * - Google:    https://ai.google.dev/gemini-api/docs/pricing
 * - Open:      one representative host per model (see `provider` + comments)
 *
 * All prices are USD per 1M tokens, standard tier (no batch/cache discounts).
 * `longContext` encodes a lab's surcharge once a prompt crosses a threshold.
 * `limitations` are short, fact-checked caveats so "cheaper" never silently
 * means "worse for your task". Pricing and limits change often, so `isStale()`
 * warns when `verified` is older than 30 days.
 */
export const MODELS: readonly ModelInfo[] = [
  // ─── OpenAI ────────────────────────────────────────────────────────────
  {
    id: "gpt-5.6-sol",
    lab: "openai",
    label: "GPT-5.6 Sol",
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    pricing: {
      inputPerMTok: 5,
      outputPerMTok: 30,
      longContext: { thresholdTokens: 272_000, inputPerMTok: 10, outputPerMTok: 45 },
    },
    limitations: [
      "Priciest 5.6 tier ($5/$30); 6× Luna's output cost",
      "Deep reasoning adds latency, not ideal for realtime loops",
      "Text + image input only; no audio or video I/O",
      "No fine-tuning; >272K-token prompts bill 2× in / 1.5× out",
    ],
    verified: "2026-07-10",
  },
  {
    id: "gpt-5.6-terra",
    lab: "openai",
    label: "GPT-5.6 Terra",
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    pricing: {
      inputPerMTok: 2.5,
      outputPerMTok: 15,
      longContext: { thresholdTokens: 272_000, inputPerMTok: 5, outputPerMTok: 22.5 },
    },
    limitations: [
      "Lower raw reasoning than Sol on the hardest tasks",
      "Text + image input, text output only; no audio/video",
      "No fine-tuning available",
      ">272K-token prompts incur 2× input / 1.5× output surcharge",
    ],
    verified: "2026-07-10",
  },
  {
    id: "gpt-5.6-luna",
    lab: "openai",
    label: "GPT-5.6 Luna",
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    pricing: {
      inputPerMTok: 1,
      outputPerMTok: 6,
      longContext: { thresholdTokens: 272_000, inputPerMTok: 2, outputPerMTok: 9 },
    },
    limitations: [
      "Nano-class: shallowest reasoning of the 5.6 line",
      "Weaker on hard coding and multi-step tool chains",
      "Text + image input only; no audio/video",
      "No fine-tuning; not for frontier-quality outputs",
    ],
    verified: "2026-07-10",
  },
  {
    id: "gpt-5.5-pro",
    lab: "openai",
    label: "GPT-5.5 Pro",
    contextWindow: 1_050_000,
    maxOutput: 128_000,
    pricing: { inputPerMTok: 30, outputPerMTok: 180 },
    limitations: [
      "Very expensive ($30/$180) and slow; overkill for routine work",
      "High latency from extended reasoning; poor for interactive UX",
      "Prior-gen 5.5 base; older knowledge cutoff than the 5.6 line",
      "No fine-tuning; text-focused, no audio/video",
    ],
    verified: "2026-07-10",
  },
  // ─── Anthropic ─────────────────────────────────────────────────────────
  {
    id: "claude-fable-5",
    lab: "anthropic",
    label: "Claude Fable 5",
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    pricing: { inputPerMTok: 10, outputPerMTok: 50 },
    limitations: [
      "Priciest tier ($10/$50); above Opus, not the default upgrade",
      "Turns can run many minutes on hard tasks, so plan timeouts/streaming",
      "Safety classifiers may return stop_reason:refusal; wire a fallback",
      "Requires 30-day retention; unavailable under ZDR (400s otherwise)",
    ],
    verified: "2026-07-10",
  },
  {
    id: "claude-opus-4-8",
    lab: "anthropic",
    label: "Claude Opus 4.8",
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    pricing: { inputPerMTok: 5, outputPerMTok: 25 },
    limitations: [
      "Expensive at $5/$25 for high-volume or latency-sensitive work",
      "temperature/top_p/top_k and budget_tokens removed (400 if sent)",
      "Narrates more than 4.7; add a silence-default for terse agents",
      "Adaptive thinking off unless set explicitly; omitting runs none",
    ],
    verified: "2026-07-10",
  },
  {
    // Standard sticker price; introductory $2/$10 applies through 2026-08-31.
    id: "claude-sonnet-5",
    lab: "anthropic",
    label: "Claude Sonnet 5",
    contextWindow: 1_000_000,
    maxOutput: 128_000,
    pricing: { inputPerMTok: 3, outputPerMTok: 15 },
    limitations: [
      "Non-default temperature/top_p/top_k and budget_tokens rejected (400)",
      "New tokenizer emits ~30% more tokens, so re-baseline cost & max_tokens",
      "Adaptive thinking on by default when omitted (was off on 4.6)",
      "Below Opus/Fable on the hardest long-horizon reasoning",
    ],
    verified: "2026-07-10",
  },
  {
    id: "claude-haiku-4-5",
    lab: "anthropic",
    label: "Claude Haiku 4.5",
    contextWindow: 200_000,
    maxOutput: 64_000,
    pricing: { inputPerMTok: 1, outputPerMTok: 5 },
    limitations: [
      "200K context and 64K max output, smallest of the four",
      "No effort parameter; effort:max errors on this model",
      "Weaker on complex reasoning, agentic, and long-horizon tasks",
      "Separate rate-limit pool from Haiku 3.x, may need a tier bump",
    ],
    verified: "2026-07-10",
  },
  // ─── xAI (Grok) ────────────────────────────────────────────────────────
  {
    id: "grok-4.3",
    lab: "xai",
    label: "Grok 4.3",
    contextWindow: 1_000_000,
    maxOutput: 131_072,
    pricing: { inputPerMTok: 1.25, outputPerMTok: 2.5 },
    limitations: [
      "Reasoning by default: hidden thinking inflates billed output tokens and latency",
      "1M context advertised, but recall degrades on deep long-context retrieval",
      "Knowledge cutoff ~Dec 2025; xAI recommends web search for newer facts",
      "Vision is input-only (text + image in); no native image/audio generation",
    ],
    verified: "2026-07-10",
  },
  {
    id: "grok-4.5",
    lab: "xai",
    label: "Grok 4.5",
    contextWindow: 500_000,
    maxOutput: 131_072,
    pricing: { inputPerMTok: 2, outputPerMTok: 6 },
    limitations: [
      "~2.4× the output price of Grok 4.3 for a smaller 500K context window",
      "500K context (vs 1M on 4.3); not the pick for the largest documents",
      "Serving throttled to ~80 tokens/sec; slower on long generations",
      "Knowledge cutoff unconfirmed in official docs; verify recency-sensitive facts",
    ],
    verified: "2026-07-10",
  },
  // ─── Google ────────────────────────────────────────────────────────────
  {
    // Prompts <=200k tokens priced at $2/$12; the whole request jumps to
    // $4/$18 above that. Preview id; no 3.x Pro GA yet.
    id: "gemini-3.1-pro-preview",
    lab: "google",
    label: "Gemini 3.1 Pro",
    contextWindow: 2_000_000,
    maxOutput: 65_536,
    pricing: {
      inputPerMTok: 2,
      outputPerMTok: 12,
      longContext: { thresholdTokens: 200_000, inputPerMTok: 4, outputPerMTok: 18 },
    },
    limitations: [
      "Still a 'preview' id; API surface and pricing may shift before GA",
      "Priciest of the line; >200k-token prompts double to $4/$18 per 1M",
      "Higher latency than Flash tiers; overkill for simple/high-volume work",
      "A distinct -customtools variant is needed for some tool-calling setups",
    ],
    verified: "2026-07-10",
  },
  {
    id: "gemini-3.5-flash",
    lab: "google",
    label: "Gemini 3.5 Flash",
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    pricing: { inputPerMTok: 1.5, outputPerMTok: 9 },
    limitations: [
      "3× the price of Gemini 3 Flash for an incremental quality gain",
      "1M context vs Pro's 2M; weaker on very long-context recall",
      "January 2025 knowledge cutoff",
      "Below 3.1 Pro on the hardest reasoning/agentic benchmarks",
    ],
    verified: "2026-07-10",
  },
  {
    id: "gemini-3-flash-preview",
    lab: "google",
    label: "Gemini 3 Flash",
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    pricing: { inputPerMTok: 0.5, outputPerMTok: 3 },
    limitations: [
      "Weaker coding/reasoning than the newer 3.5 Flash",
      "Still a 'preview' id; may be deprecated as 3.5 Flash matures",
      "Audio input billed 2× text at $1.00/1M tokens",
      "No priority/flex discount tiers as broad as newer models",
    ],
    verified: "2026-07-10",
  },
  {
    id: "gemini-3.1-flash-lite",
    lab: "google",
    label: "Gemini 3.1 Flash-Lite",
    contextWindow: 1_048_576,
    maxOutput: 65_536,
    pricing: { inputPerMTok: 0.25, outputPerMTok: 1.5 },
    limitations: [
      "Lowest reasoning/coding quality; struggles with complex multi-step tasks",
      "Weaker instruction-following and tool-calling than Flash/Pro",
      "Degraded recall over long (near-1M) contexts",
      "Audio input billed 2× text at $0.50/1M tokens",
    ],
    verified: "2026-07-10",
  },
  // ─── Open-weight (hosted) ──────────────────────────────────────────────
  // Prices are one representative host per model, verified 2026-07-10. The
  // same weights are served by many providers at different rates, and
  // `provider` records which one; self-host to pay infra cost only.
  {
    id: "deepseek-v4-pro",
    lab: "open",
    label: "DeepSeek V4 Pro",
    provider: "DeepSeek",
    contextWindow: 1_000_000,
    maxOutput: 384_000,
    pricing: { inputPerMTok: 0.435, outputPerMTok: 0.87 },
    limitations: [
      "Text-only: no vision/audio/image input despite 1M context",
      "Labeled preview; reasoning needs a large max-output budget to shine",
      "FP4+FP8 mixed precision may reduce numeric precision in edge cases",
      "Thinking mode adds latency and token overhead vs Flash",
    ],
    verified: "2026-07-10",
  },
  {
    id: "deepseek-v4-flash",
    lab: "open",
    label: "DeepSeek V4 Flash",
    provider: "DeepSeek",
    contextWindow: 1_000_000,
    maxOutput: 384_000,
    pricing: { inputPerMTok: 0.14, outputPerMTok: 0.28 },
    limitations: [
      "Text-only; no multimodal input",
      "Weaker on hard reasoning/coding vs V4 Pro (fewer active params)",
      "13B activated params caps deep long-context recall accuracy",
      "Legacy deepseek-chat/reasoner aliases route here (deprecate 2026-07-24)",
    ],
    verified: "2026-07-10",
  },
  {
    id: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    lab: "open",
    label: "Llama 4 Maverick",
    provider: "DeepInfra",
    contextWindow: 1_048_576,
    maxOutput: 8_192,
    pricing: { inputPerMTok: 0.15, outputPerMTok: 0.6 },
    limitations: [
      "Trails DeepSeek/Qwen frontier open models on hard reasoning & coding",
      "Tool-calling less reliable than closed models; needs strict scaffolding",
      "Knowledge cutoff ~Aug 2024; no built-in reasoning mode",
      "FP8 quant + 400B MoE = heavy VRAM; recall degrades past ~256K",
    ],
    verified: "2026-07-10",
  },
  {
    id: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    lab: "open",
    label: "Llama 4 Scout",
    provider: "DeepInfra",
    contextWindow: 327_680,
    maxOutput: 8_192,
    pricing: { inputPerMTok: 0.1, outputPerMTok: 0.3 },
    limitations: [
      "Advertised 10M context is theoretical; DeepInfra caps at ~328K",
      "Weaker at coding, math and multi-step reasoning than Maverick",
      "Tool-calling and strict instruction-following noticeably less robust",
      "Knowledge cutoff ~Aug 2024; no native reasoning mode",
    ],
    verified: "2026-07-10",
  },
  {
    id: "qwen3-coder-480b-a35b-instruct",
    lab: "open",
    label: "Qwen3-Coder 480B",
    provider: "OpenRouter",
    contextWindow: 262_144,
    maxOutput: 65_536,
    pricing: { inputPerMTok: 0.22, outputPerMTok: 1.8 },
    limitations: [
      "No thinking mode; weaker on hard multi-step reasoning",
      "Text-only: no image, audio, or multimodal input",
      "Tiered pricing: cost jumps once a request exceeds 128K input tokens",
      "480B/35B MoE is heavy to self-host; needs multi-GPU or a hosted API",
    ],
    verified: "2026-07-10",
  },
  {
    id: "qwen3-235b-a22b-instruct-2507",
    lab: "open",
    label: "Qwen3 235B",
    provider: "Alibaba",
    contextWindow: 262_144,
    maxOutput: 16_384,
    pricing: { inputPerMTok: 0.7, outputPerMTok: 2.8 },
    limitations: [
      "Non-reasoning Instruct: no <think> chains; use the Thinking variant",
      "Text-only; no multimodal input",
      "Pricey for an open non-reasoning model of its size",
      "16K max output caps very long single-turn generations",
    ],
    verified: "2026-07-10",
  },
  {
    id: "glm-5.2",
    lab: "open",
    label: "GLM-5.2",
    provider: "Z.ai",
    contextWindow: 1_000_000,
    maxOutput: 131_072,
    pricing: { inputPerMTok: 1.4, outputPerMTok: 4.4 },
    limitations: [
      "Trails Claude Opus 4.8 on SWE-bench Pro (62.1 vs 69.2) for hard coding",
      "1M context advertised, but recall degrades on deep retrieval",
      "Weaker non-English/multilingual polish than Western frontier models",
      "Reasoning verbosity inflates output tokens and latency on agent loops",
    ],
    verified: "2026-07-10",
  },
  {
    id: "glm-5",
    lab: "open",
    label: "GLM-5",
    provider: "Z.ai",
    contextWindow: 1_000_000,
    maxOutput: 131_072,
    pricing: { inputPerMTok: 1, outputPerMTok: 3.2 },
    limitations: [
      "Superseded by GLM-5.2 on coding and tool-calling benchmarks",
      "No RMB-native discount edge over 5.2; older knowledge cutoff",
      "Long-horizon agent stability weaker than 5.2's refinements",
    ],
    verified: "2026-07-10",
  },
  {
    id: "mistral-large-3-25-12",
    lab: "open",
    label: "Mistral Large 3",
    provider: "Mistral",
    contextWindow: 256_000,
    maxOutput: 8_192,
    pricing: { inputPerMTok: 0.5, outputPerMTok: 1.5 },
    limitations: [
      "Non-reasoning instruct; a reasoning variant is only 'coming soon'",
      "675B MoE: heavy self-host footprint, needs multi-GPU (H200-class)",
      "Trails top closed frontier models on hardest coding/agentic benchmarks",
      "Undisclosed knowledge cutoff; verify recency-sensitive facts",
    ],
    verified: "2026-07-10",
  },
  {
    id: "ministral-3-14b-25-12",
    lab: "open",
    label: "Ministral 3 14B",
    provider: "Mistral",
    contextWindow: 256_000,
    maxOutput: 8_192,
    pricing: { inputPerMTok: 0.2, outputPerMTok: 0.2 },
    limitations: [
      "14B dense caps raw capability vs 675B Large 3 on hard tasks",
      "Base instruct is non-reasoning; use the reasoning variant for math",
      "Weaker long-context recall vs frontier despite a 256K window",
      "Undisclosed knowledge cutoff",
    ],
    verified: "2026-07-10",
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
