import { describe, expect, it } from "vitest";
import { calculatePriceChange } from "../src/price-change/calculate";

describe("calculatePriceChange", () => {
  it("computes the extra volume a discount requires", () => {
    // $100 price, $60 cost, 20% off -> $80 price, $20 profit vs $40 -> sell 100% more.
    const result = calculatePriceChange({ currentPrice: 100, unitCost: 60, changePercent: -20 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.newPrice).toBeCloseTo(80, 6);
    expect(result.data.newProfitPerUnit).toBeCloseTo(20, 6);
    expect(result.data.volumeChangeToBreakEvenPercent).toBeCloseTo(100, 6);
    expect(result.data.currentMarginPercent).toBeCloseTo(40, 6);
    expect(result.data.newMarginPercent).toBeCloseTo(25, 6);
  });

  it("computes how much volume a price increase can afford to lose", () => {
    // $100 price, $60 cost, +10% -> $110, $50 profit vs $40 -> can lose 20%.
    const result = calculatePriceChange({ currentPrice: 100, unitCost: 60, changePercent: 10 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.volumeChangeToBreakEvenPercent).toBeCloseTo(-20, 6);
  });

  it("keeps total gross profit identical at the break-even volume", () => {
    const result = calculatePriceChange({ currentPrice: 37.5, unitCost: 21.25, changePercent: -12.5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const oldProfit = 1000 * result.data.currentProfitPerUnit;
    const newVolume = 1000 * (1 + result.data.volumeChangeToBreakEvenPercent! / 100);
    expect(newVolume * result.data.newProfitPerUnit).toBeCloseTo(oldProfit, 6);
  });

  it("returns null volume when the discounted price is at or below cost", () => {
    const atCost = calculatePriceChange({ currentPrice: 100, unitCost: 60, changePercent: -40 });
    expect(atCost.ok).toBe(true);
    if (!atCost.ok) return;
    expect(atCost.data.volumeChangeToBreakEvenPercent).toBeNull();

    const belowCost = calculatePriceChange({ currentPrice: 100, unitCost: 60, changePercent: -50 });
    expect(belowCost.ok).toBe(true);
    if (!belowCost.ok) return;
    expect(belowCost.data.volumeChangeToBreakEvenPercent).toBeNull();
    expect(belowCost.data.newMarginPercent).toBeLessThan(0);
  });

  it("treats a zero change as no volume change", () => {
    const result = calculatePriceChange({ currentPrice: 50, unitCost: 20, changePercent: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.volumeChangeToBreakEvenPercent).toBeCloseTo(0, 10);
  });

  it("rejects a unit cost at or above the current price", () => {
    const result = calculatePriceChange({ currentPrice: 50, unitCost: 50, changePercent: -10 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/below the current price/);
  });

  it("rejects a 100% price cut", () => {
    const result = calculatePriceChange({ currentPrice: 50, unitCost: 20, changePercent: -100 });
    expect(result.ok).toBe(false);
  });

  it("rejects non-numeric input", () => {
    const result = calculatePriceChange({ currentPrice: Number.NaN, unitCost: 20, changePercent: 5 });
    expect(result.ok).toBe(false);
  });
});
