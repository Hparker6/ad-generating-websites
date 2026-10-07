import { describe, expect, it } from "vitest";
import { calculateContributionMargin } from "../src/contribution-margin/calculate";

describe("calculateContributionMargin", () => {
  it("computes a positive margin", () => {
    const result = calculateContributionMargin({ sellingPrice: 50, variableCost: 30 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.contributionMarginPerUnit).toBe(20);
    expect(result.data.contributionMarginRatio).toBeCloseTo(0.4, 5);
  });

  it("allows a zero margin (price equals variable cost)", () => {
    const result = calculateContributionMargin({ sellingPrice: 20, variableCost: 20 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.contributionMarginPerUnit).toBe(0);
    expect(result.data.contributionMarginRatio).toBe(0);
  });

  it("allows a negative margin when variable cost exceeds price (informative, not an error)", () => {
    const result = calculateContributionMargin({ sellingPrice: 20, variableCost: 30 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.contributionMarginPerUnit).toBe(-10);
    expect(result.data.contributionMarginRatio).toBeCloseTo(-0.5, 5);
  });

  it("rejects a zero or negative selling price", () => {
    const result = calculateContributionMargin({ sellingPrice: 0, variableCost: 10 });
    expect(result.ok).toBe(false);
  });

  it("rejects a negative variable cost", () => {
    const result = calculateContributionMargin({ sellingPrice: 10, variableCost: -1 });
    expect(result.ok).toBe(false);
  });
});
