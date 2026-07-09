import { describe, expect, it } from "vitest";
import { MODELS, getModel, modelsByLab } from "../src/registry.js";
import { LABS, type Lab } from "../src/types.js";

describe("model registry", () => {
  it("has models for every lab in LABS", () => {
    for (const lab of LABS) {
      expect(modelsByLab(lab).length, `expected at least one ${lab} model`).toBeGreaterThan(0);
    }
  });

  it("covers all five labs including xai and open", () => {
    const labs = new Set<Lab>(MODELS.map((m) => m.lab));
    expect(labs).toEqual(new Set<Lab>(["openai", "anthropic", "google", "xai", "open"]));
  });

  it("gives every model a non-empty, concrete limitations list", () => {
    for (const m of MODELS) {
      expect(m.limitations, `${m.id} has no limitations`).toBeDefined();
      expect(m.limitations!.length, `${m.id} has an empty limitations list`).toBeGreaterThan(0);
      for (const lim of m.limitations!) {
        expect(lim.trim().length, `${m.id} has a blank limitation`).toBeGreaterThan(10);
      }
    }
  });

  it("labels every open-weight model with a hosting provider", () => {
    for (const m of modelsByLab("open")) {
      expect(m.provider, `open model ${m.id} is missing a provider`).toBeTruthy();
    }
  });

  it("has sane, positive pricing and a higher output rate than input", () => {
    for (const m of MODELS) {
      expect(m.pricing.inputPerMTok, `${m.id} input price`).toBeGreaterThan(0);
      expect(m.pricing.outputPerMTok, `${m.id} output price`).toBeGreaterThanOrEqual(
        m.pricing.inputPerMTok,
      );
    }
  });

  it("only sets a long-context tier that costs more than the base tier", () => {
    for (const m of MODELS) {
      const lc = m.pricing.longContext;
      if (!lc) continue;
      expect(lc.thresholdTokens, `${m.id} threshold`).toBeGreaterThan(0);
      expect(lc.inputPerMTok, `${m.id} long-ctx input`).toBeGreaterThanOrEqual(
        m.pricing.inputPerMTok,
      );
      expect(lc.outputPerMTok, `${m.id} long-ctx output`).toBeGreaterThanOrEqual(
        m.pricing.outputPerMTok,
      );
    }
  });

  it("resolves known ids and returns undefined for unknown ones", () => {
    expect(getModel("grok-4.3")?.lab).toBe("xai");
    expect(getModel("glm-5.2")?.lab).toBe("open");
    expect(getModel("no-such-model")).toBeUndefined();
  });
});
