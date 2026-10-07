import { describe, expect, it } from "vitest";
import { calculateFreelanceRate } from "../src/freelance-rate/calculate";

const base = {
  targetIncome: 75_000,
  annualExpenses: 10_000,
  taxRatePercent: 25,
  billableHoursPerWeek: 25,
  weeksPerYear: 46,
};

describe("calculateFreelanceRate", () => {
  it("grosses up income for tax, adds expenses, and divides by billable hours", () => {
    // 75,000 / 0.75 = 100,000 pre-tax profit; + 10,000 = 110,000; / 1,150 h.
    const result = calculateFreelanceRate(base);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.annualRevenueNeeded).toBeCloseTo(110_000, 6);
    expect(result.data.billableHoursPerYear).toBe(1_150);
    expect(result.data.hourlyRate).toBeCloseTo(95.652, 3);
    expect(result.data.dayRate).toBeCloseTo(result.data.hourlyRate * 8, 10);
    expect(result.data.estimatedTax).toBeCloseTo(25_000, 6);
  });

  it("leaves the target income after expenses and tax", () => {
    const result = calculateFreelanceRate({ ...base, taxRatePercent: 31.5, annualExpenses: 7_250 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const profit = result.data.annualRevenueNeeded - 7_250;
    expect(profit * (1 - 0.315)).toBeCloseTo(75_000, 6);
  });

  it("handles a zero tax rate", () => {
    const result = calculateFreelanceRate({ ...base, taxRatePercent: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.annualRevenueNeeded).toBeCloseTo(85_000, 6);
    expect(result.data.estimatedTax).toBe(0);
  });

  it("rejects zero billable hours", () => {
    const result = calculateFreelanceRate({ ...base, billableHoursPerWeek: 0 });
    expect(result.ok).toBe(false);
  });

  it("rejects more than 52 weeks", () => {
    const result = calculateFreelanceRate({ ...base, weeksPerYear: 53 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/52 weeks/);
  });

  it("rejects a tax rate above 90%", () => {
    const result = calculateFreelanceRate({ ...base, taxRatePercent: 95 });
    expect(result.ok).toBe(false);
  });
});
