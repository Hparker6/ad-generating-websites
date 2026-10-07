import { describe, expect, it } from "vitest";
import { calculateMarkupMargin } from "../src/markup-margin/calculate";

describe("calculateMarkupMargin", () => {
  it("computes markup and margin for a normal case", () => {
    // $60 cost, $100 price: $40 profit -> 66.67% markup on cost, 40% margin on price.
    const result = calculateMarkupMargin({ unitCost: 60, sellingPrice: 100 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.markupPercent).toBeCloseTo(66.666, 2);
    expect(result.data.marginPercent).toBeCloseTo(40, 5);
    expect(result.data.profitPerUnit).toBeCloseTo(40, 6);
  });

  it("reports the shared profit numerator behind both percentages", () => {
    const result = calculateMarkupMargin({ unitCost: 100, sellingPrice: 80 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.profitPerUnit).toBeCloseTo(-20, 6);
  });

  it("markup and margin are equal only when both are zero", () => {
    const result = calculateMarkupMargin({ unitCost: 50, sellingPrice: 50 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.markupPercent).toBe(0);
    expect(result.data.marginPercent).toBe(0);
  });

  it("returns negative markup/margin when selling below cost (informative, not an error)", () => {
    const result = calculateMarkupMargin({ unitCost: 100, sellingPrice: 80 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.markupPercent).toBeCloseTo(-20, 5);
    expect(result.data.marginPercent).toBeCloseTo(-25, 5);
  });

  it("rejects a zero or negative unit cost", () => {
    const result = calculateMarkupMargin({ unitCost: 0, sellingPrice: 50 });
    expect(result.ok).toBe(false);
  });

  it("rejects a zero or negative selling price", () => {
    const result = calculateMarkupMargin({ unitCost: 50, sellingPrice: -5 });
    expect(result.ok).toBe(false);
  });
});
