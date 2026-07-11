import { getModel } from "labkit-core";
import { describe, expect, it } from "vitest";
import { estimateForModel } from "../src/index.js";

/** A fixed-count tokenizer so we can drive input token counts precisely. */
const fixed = (n: number) => ({ google: { lab: "google" as const, exact: true, count: () => n } });

describe("long-context tiered pricing", () => {
  const pro = getModel("gemini-3.1-pro-preview");

  it("registry model carries a long-context tier", () => {
    expect(pro?.pricing.longContext).toEqual({
      thresholdTokens: 200_000,
      inputPerMTok: 4,
      outputPerMTok: 18,
    });
  });

  it("uses the base rate at or below the threshold", () => {
    const est = estimateForModel("x", pro!, {
      tokenizers: fixed(200_000),
      outputTokens: 1_000,
    });
    // $2/MTok input, $12/MTok output
    expect(est.inputCost).toBeCloseTo((200_000 / 1e6) * 2, 10);
    expect(est.outputCost).toBeCloseTo((1_000 / 1e6) * 12, 10);
  });

  it("switches the whole request to the long-context rate above the threshold", () => {
    const est = estimateForModel("x", pro!, {
      tokenizers: fixed(200_001),
      outputTokens: 1_000,
    });
    // $4/MTok input, $18/MTok output
    expect(est.inputCost).toBeCloseTo((200_001 / 1e6) * 4, 10);
    expect(est.outputCost).toBeCloseTo((1_000 / 1e6) * 18, 10);
  });

  it("leaves flat-priced models unaffected by long input", () => {
    const flash = getModel("gemini-3.1-flash-lite")!;
    const est = estimateForModel("x", flash, { tokenizers: fixed(500_000) });
    expect(est.inputCost).toBeCloseTo((500_000 / 1e6) * 0.25, 10);
  });
});
