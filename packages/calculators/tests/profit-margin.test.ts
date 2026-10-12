import { describe, expect, it } from "vitest";
import { calculateProfitMargin } from "../src/profit-margin/calculate";

// Cases from docs/calculator-specs.md, computed by hand.
describe("calculateProfitMargin", () => {
  it("computes gross, operating, and net margin from an income statement", () => {
    const result = calculateProfitMargin({
      revenue: 100_000,
      costOfGoodsSold: 60_000,
      operatingExpenses: 25_000,
      interestAndTaxes: 5_000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.grossProfit).toBe(40_000);
    expect(result.data.grossMarginPercent).toBeCloseTo(40, 10);
    expect(result.data.operatingProfit).toBe(15_000);
    expect(result.data.operatingMarginPercent).toBeCloseTo(15, 10);
    expect(result.data.netProfit).toBe(10_000);
    expect(result.data.netMarginPercent).toBeCloseTo(10, 10);
    expect(result.data.markupPercent).toBeCloseTo(66.6667, 3);
  });

  it("collapses to one margin when there are no expenses below gross profit", () => {
    const result = calculateProfitMargin({ revenue: 50, costOfGoodsSold: 30, operatingExpenses: 0, interestAndTaxes: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.grossMarginPercent).toBeCloseTo(40, 10);
    expect(result.data.operatingMarginPercent).toBeCloseTo(40, 10);
    expect(result.data.netMarginPercent).toBeCloseTo(40, 10);
  });

  it("reports a loss as a negative margin rather than rejecting it", () => {
    const result = calculateProfitMargin({ revenue: 1_000, costOfGoodsSold: 1_200, operatingExpenses: 100, interestAndTaxes: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.grossProfit).toBe(-200);
    expect(result.data.grossMarginPercent).toBeCloseTo(-20, 10);
    expect(result.data.operatingMarginPercent).toBeCloseTo(-30, 10);
    expect(result.data.netMarginPercent).toBeCloseTo(-30, 10);
    expect(result.data.markupPercent).toBeCloseTo(-16.6667, 3);
  });

  it("returns no markup when COGS is zero, and a 100% margin", () => {
    const result = calculateProfitMargin({ revenue: 500, costOfGoodsSold: 0, operatingExpenses: 0, interestAndTaxes: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.grossMarginPercent).toBe(100);
    expect(result.data.markupPercent).toBeNull();
  });

  it("rejects zero revenue", () => {
    const result = calculateProfitMargin({ revenue: 0, costOfGoodsSold: 0, operatingExpenses: 0, interestAndTaxes: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/Revenue must be greater than 0/);
  });

  it("rejects negative costs", () => {
    const result = calculateProfitMargin({ revenue: 100, costOfGoodsSold: -5, operatingExpenses: 0, interestAndTaxes: 0 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/can't be negative/);
  });
});
