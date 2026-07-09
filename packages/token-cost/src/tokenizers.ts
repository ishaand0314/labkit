import { countTokens as anthropicLocalCount } from "@anthropic-ai/tokenizer";
import type { Tokenizer } from "@labkit/core";
import { modelsByLab } from "@labkit/core";
import { type Tiktoken, getEncoding } from "js-tiktoken";
import type { TokenizerMap } from "./index.js";

/**
 * Per-lab tokenizers, honestly labelled.
 *
 * - OpenAI: js-tiktoken `o200k_base` — exact, offline (GPT-4o and later).
 * - Anthropic: `@anthropic-ai/tokenizer` — the Claude-2-era local tokenizer.
 *   Close, but NOT exact for Claude 4+ models, so it stays labelled an estimate.
 * - Google: no offline tokenizer exists — a ~4 chars/token heuristic, labelled
 *   estimate.
 *
 * `resolveTokenizers()` upgrades Anthropic/Google to exact API-backed counts
 * when the relevant API key is present. It never blocks on a missing key.
 *
 * NOTE on comparability: the offline OpenAI count is raw-text tokens. The
 * exact API-backed Anthropic/Google counts are request-level (they count a
 * one-user-message request), so they include a few tokens of message
 * scaffolding — expect Anthropic exact counts to run a few tokens higher than
 * the equivalent raw-text count. For short prompts that gap is visible; for
 * realistic prompts it is noise.
 */

let encoder: Tiktoken | undefined;

/** Exact OpenAI counts via tiktoken's o200k_base (GPT-4o and later). */
export const openaiTokenizer = (): Tokenizer => ({
  lab: "openai",
  exact: true,
  count: (text: string) => {
    encoder ??= getEncoding("o200k_base");
    return encoder.encode(text).length;
  },
});

/** Anthropic counts via the local Claude-2-era tokenizer — good estimate, not exact. */
export const anthropicTokenizer = (): Tokenizer => ({
  lab: "anthropic",
  exact: false,
  count: (text: string) => Math.max(1, anthropicLocalCount(text)),
});

/** Google has no offline tokenizer; a ~4 chars/token heuristic is the honest fallback. */
export const googleTokenizer = (): Tokenizer => ({
  lab: "google",
  exact: false,
  count: (text: string) => Math.max(1, Math.ceil(text.length / 4)),
});

/** The default map: best available offline tokenizer per lab. */
export function defaultTokenizers(): TokenizerMap {
  return {
    openai: openaiTokenizer(),
    anthropic: anthropicTokenizer(),
    google: googleTokenizer(),
  };
}

export interface ResolveOptions {
  /** Defaults to process.env.ANTHROPIC_API_KEY. */
  readonly anthropicApiKey?: string;
  /** Defaults to process.env.GEMINI_API_KEY. */
  readonly geminiApiKey?: string;
  /** Injectable for tests. Defaults to global fetch. */
  readonly fetchFn?: typeof fetch;
  /** Per-request timeout in ms. Default 5000. */
  readonly timeoutMs?: number;
}

async function fetchJson(
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<unknown> {
  const res = await fetchFn(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

/** Exact Anthropic count for `text` via the free count_tokens endpoint. */
async function countAnthropicViaApi(
  text: string,
  apiKey: string,
  fetchFn: typeof fetch,
  timeoutMs: number,
): Promise<number> {
  const model = modelsByLab("anthropic")[0]?.id ?? "claude-opus-4-8";
  const body = await fetchJson(
    fetchFn,
    "https://api.anthropic.com/v1/messages/count_tokens",
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model, messages: [{ role: "user", content: text }] }),
    },
    timeoutMs,
  );
  const tokens = (body as { input_tokens?: number }).input_tokens;
  if (typeof tokens !== "number") throw new Error("count_tokens: missing input_tokens");
  return tokens;
}

/** Exact Gemini count for `text` via the free countTokens endpoint. */
async function countGeminiViaApi(
  text: string,
  apiKey: string,
  fetchFn: typeof fetch,
  timeoutMs: number,
): Promise<number> {
  // Registry ids may be preview aliases; the countTokens endpoint needs a
  // model path it recognises. Strip a "-preview" suffix and fall back to a
  // stable Flash id so a preview alias in the registry doesn't 400 the count.
  const registryId = modelsByLab("google")[0]?.id;
  const model = registryId?.replace(/-preview$/, "") ?? "gemini-3.5-flash";
  const body = await fetchJson(
    fetchFn,
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:countTokens`,
    {
      method: "POST",
      headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
    },
    timeoutMs,
  );
  const tokens = (body as { totalTokens?: number }).totalTokens;
  if (typeof tokens !== "number") throw new Error("countTokens: missing totalTokens");
  return tokens;
}

/**
 * Best-available tokenizer map for one specific `text`.
 *
 * Starts from `defaultTokenizers()` and upgrades Anthropic / Google to exact,
 * API-backed counts when a key is available. API failures (or missing keys)
 * silently keep the offline fallback — this never blocks and never throws.
 *
 * NOTE: the upgraded tokenizers return a count valid only for the `text`
 * passed here (the APIs count a fixed string). Fine for a CLI invocation;
 * for arbitrary reuse, stick with `defaultTokenizers()`.
 */
export async function resolveTokenizers(
  text: string,
  opts: ResolveOptions = {},
): Promise<TokenizerMap> {
  const map = defaultTokenizers();
  const fetchFn = opts.fetchFn ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 5000;
  const anthropicKey = opts.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY;
  const geminiKey = opts.geminiApiKey ?? process.env.GEMINI_API_KEY;

  const [anthropicCount, geminiCount] = await Promise.all([
    anthropicKey
      ? countAnthropicViaApi(text, anthropicKey, fetchFn, timeoutMs).catch(() => undefined)
      : Promise.resolve(undefined),
    geminiKey
      ? countGeminiViaApi(text, geminiKey, fetchFn, timeoutMs).catch(() => undefined)
      : Promise.resolve(undefined),
  ]);

  if (anthropicCount !== undefined) {
    map.anthropic = { lab: "anthropic", exact: true, count: () => anthropicCount };
  }
  if (geminiCount !== undefined) {
    map.google = { lab: "google", exact: true, count: () => geminiCount };
  }
  return map;
}
