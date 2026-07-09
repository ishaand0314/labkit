import { MODELS } from "@labkit/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { estimateForModel } from "../src/index.js";
import {
  anthropicTokenizer,
  defaultTokenizers,
  googleTokenizer,
  openTokenizer,
  openaiTokenizer,
  resolveTokenizers,
  xaiTokenizer,
} from "../src/tokenizers.js";

const PANGRAM = "The quick brown fox jumps over the lazy dog.";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

/** Fake fetch that serves the two counting endpoints. */
const fakeFetch: typeof fetch = async (input) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.includes("api.anthropic.com/v1/messages/count_tokens")) {
    return jsonResponse({ input_tokens: 123 });
  }
  if (url.includes("generativelanguage.googleapis.com") && url.includes(":countTokens")) {
    return jsonResponse({ totalTokens: 456 });
  }
  throw new Error(`unexpected fetch: ${url}`);
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("offline tokenizers", () => {
  it("openaiTokenizer counts the pangram exactly (o200k_base)", () => {
    const tok = openaiTokenizer();
    expect(tok.count(PANGRAM)).toBe(10);
    expect(tok.exact).toBe(true);
  });

  it("anthropicTokenizer returns >= 1 for non-empty text and is not exact", () => {
    const tok = anthropicTokenizer();
    expect(tok.count(PANGRAM)).toBeGreaterThanOrEqual(1);
    expect(tok.exact).toBeFalsy();
  });

  it("googleTokenizer returns >= 1 for non-empty text and is not exact", () => {
    const tok = googleTokenizer();
    expect(tok.count(PANGRAM)).toBeGreaterThanOrEqual(1);
    expect(tok.exact).toBeFalsy();
  });

  it("xaiTokenizer returns >= 1 for non-empty text and is not exact", () => {
    const tok = xaiTokenizer();
    expect(tok.lab).toBe("xai");
    expect(tok.count(PANGRAM)).toBeGreaterThanOrEqual(1);
    expect(tok.exact).toBeFalsy();
  });

  it("openTokenizer returns >= 1 for non-empty text and is not exact", () => {
    const tok = openTokenizer();
    expect(tok.lab).toBe("open");
    expect(tok.count(PANGRAM)).toBeGreaterThanOrEqual(1);
    expect(tok.exact).toBeFalsy();
  });

  it("defaultTokenizers provides a tokenizer for every lab", () => {
    const map = defaultTokenizers();
    for (const lab of ["openai", "anthropic", "google", "xai", "open"] as const) {
      expect(map[lab], `no default tokenizer for ${lab}`).toBeDefined();
    }
  });
});

describe("estimateForModel exactness propagation", () => {
  it("marks OpenAI estimates exact and Anthropic estimates inexact", () => {
    const tokenizers = defaultTokenizers();
    const openaiModel = MODELS.find((m) => m.lab === "openai");
    const anthropicModel = MODELS.find((m) => m.lab === "anthropic");
    expect(openaiModel).toBeDefined();
    expect(anthropicModel).toBeDefined();
    expect(estimateForModel(PANGRAM, openaiModel!, { tokenizers }).exact).toBe(true);
    expect(estimateForModel(PANGRAM, anthropicModel!, { tokenizers }).exact).toBe(false);
  });
});

describe("resolveTokenizers", () => {
  it("upgrades Anthropic and Google to exact API-backed counts", async () => {
    const map = await resolveTokenizers(PANGRAM, {
      anthropicApiKey: "fake-anthropic-key",
      geminiApiKey: "fake-gemini-key",
      fetchFn: fakeFetch,
    });
    expect(map.anthropic?.count("x")).toBe(123);
    expect(map.anthropic?.exact).toBe(true);
    expect(map.google?.count("x")).toBe(456);
    expect(map.google?.exact).toBe(true);
  });

  it("silently falls back to offline defaults when fetch rejects", async () => {
    const rejectingFetch: typeof fetch = async () => {
      throw new Error("network down");
    };
    const map = await resolveTokenizers(PANGRAM, {
      anthropicApiKey: "fake-anthropic-key",
      geminiApiKey: "fake-gemini-key",
      fetchFn: rejectingFetch,
    });
    expect(map.anthropic?.exact).toBeFalsy();
    expect(map.google?.exact).toBeFalsy();
    expect(map.anthropic?.count(PANGRAM)).toBeGreaterThanOrEqual(1);
    expect(map.google?.count(PANGRAM)).toBeGreaterThanOrEqual(1);
  });

  it("never calls fetch when no keys are available", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    const explodingFetch: typeof fetch = async () => {
      throw new Error("fetch must not be called without keys");
    };
    const fetchSpy = vi.fn(explodingFetch);
    const map = await resolveTokenizers(PANGRAM, { fetchFn: fetchSpy });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(map.openai?.exact).toBe(true);
    expect(map.anthropic?.exact).toBeFalsy();
    expect(map.google?.exact).toBeFalsy();
  });
});
