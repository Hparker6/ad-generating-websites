import { describe, expect, it } from "vitest";
import { calculateSellingPrice } from "../src/selling-price/calculate";

describe("calculateSellingPrice", () => {
  it("computes the required price for a normal margin target", () => {
    // $60 cost, 40% desired margin -> price = 60 / (1 - 0.4) = 100
    const result = calculateSellingPrice({ unitCost: 60, desiredMarginPercent: 40 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.requiredSellingPrice).toBeCloseTo(100, 6);
    expect(result.data.equivalentMarkupPercent).toBeCloseTo(66.666, 2);
  });

  it("produces a price that actually yields the requested margin", () => {
    const result = calculateSellingPrice({ unitCost: 7, desiredMarginPercent: 35 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const price = result.data.requiredSellingPrice;
    const realizedMargin = ((price - 7) / price) * 100;
    expect(realizedMargin).toBeCloseTo(35, 6);
  });

  it("keeps markup and margin consistent with each other", () => {
    // markup = margin / (1 - margin) for the same price.
    const result = calculateSellingPrice({ unitCost: 12.34, desiredMarginPercent: 42.5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.equivalentMarkupPercent).toBeCloseTo((42.5 / (100 - 42.5)) * 100, 6);
  });

  it("allows a desired margin of zero (price equals cost)", () => {
    const result = calculateSellingPrice({ unitCost: 50, desiredMarginPercent: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.requiredSellingPrice).toBe(50);
    expect(result.data.equivalentMarkupPercent).toBe(0);
  });

  it("rejects a desired margin of 100% or more (impossible — infinite price)", () => {
    const result = calculateSellingPrice({ unitCost: 50, desiredMarginPercent: 100 });
    expect(result.ok).toBe(false);
  });

  it("rejects a negative desired margin", () => {
    const result = calculateSellingPrice({ unitCost: 50, desiredMarginPercent: -5 });
    expect(result.ok).toBe(false);
  });

  it("rejects a zero or negative unit cost", () => {
    const result = calculateSellingPrice({ unitCost: 0, desiredMarginPercent: 20 });
    expect(result.ok).toBe(false);
  });
});
