import { MODELS } from "@labkit/core";
import { describe, expect, it } from "vitest";
import { compare, estimateForModel, heuristicTokenizer } from "../src/index.js";

describe("token-cost comparator", () => {
  it("returns an estimate for every model by default", () => {
    const results = compare("hello world");
    expect(results).toHaveLength(MODELS.length);
  });

  it("sorts results cheapest-first", () => {
    const results = compare("some longer prompt to price out", { outputTokens: 1000 });
    for (let i = 1; i < results.length; i++) {
      expect(results[i]!.totalCost).toBeGreaterThanOrEqual(results[i - 1]!.totalCost);
    }
  });

  it("charges more when output tokens increase", () => {
    const model = MODELS[0]!;
    const cheap = estimateForModel("x".repeat(400), model, { outputTokens: 0 });
    const pricey = estimateForModel("x".repeat(400), model, { outputTokens: 5000 });
    expect(pricey.totalCost).toBeGreaterThan(cheap.totalCost);
  });

  it("respects a custom tokenizer override", () => {
    const fixed = { openai: { lab: "openai" as const, count: () => 42 } };
    const openaiModel = MODELS.find((m) => m.lab === "openai")!;
    const est = estimateForModel("anything", openaiModel, { tokenizers: fixed });
    expect(est.inputTokens).toBe(42);
  });

  it("heuristic tokenizer never returns zero for non-empty text", () => {
    expect(heuristicTokenizer("openai").count("a")).toBeGreaterThanOrEqual(1);
  });
});
