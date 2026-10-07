import { describe, expect, it } from "vitest";
import { calculateBreakEven } from "../src/break-even/calculate";

describe("calculateBreakEven", () => {
  it("computes break-even units and revenue for a normal case", () => {
    const result = calculateBreakEven({
      fixedCosts: 10_000,
      pricePerUnit: 50,
      variableCostPerUnit: 30,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.contributionMarginPerUnit).toBe(20);
    expect(result.data.contributionMarginRatio).toBeCloseTo(0.4, 5);
    expect(result.data.breakEvenUnits).toBe(500);
    expect(result.data.breakEvenRevenue).toBe(25_000);
  });

  it("scales linearly with fixed costs", () => {
    // $1,000 of fixed costs at a $20 contribution margin is 50 units — one
    // tenth of the $10,000 case, not the same answer.
    const result = calculateBreakEven({
      fixedCosts: 1_000,
      pricePerUnit: 50,
      variableCostPerUnit: 30,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.breakEvenUnits).toBe(50);
    expect(result.data.breakEvenRevenue).toBe(2_500);
  });

  it("allows zero fixed costs (break-even at zero units)", () => {
    const result = calculateBreakEven({ fixedCosts: 0, pricePerUnit: 10, variableCostPerUnit: 4 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.breakEvenUnits).toBe(0);
    expect(result.data.breakEvenRevenue).toBe(0);
  });

  it("rejects a zero contribution margin (price equals variable cost)", () => {
    const result = calculateBreakEven({ fixedCosts: 1000, pricePerUnit: 20, variableCostPerUnit: 20 });
    expect(result.ok).toBe(false);
  });

  it("rejects a negative contribution margin (variable cost exceeds price)", () => {
    const result = calculateBreakEven({ fixedCosts: 1000, pricePerUnit: 20, variableCostPerUnit: 25 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]).toMatch(/greater than variable cost/i);
  });

  it("accepts a sub-cent contribution margin instead of falsely rejecting it", () => {
    // $0.004 margin is real, just small — it must not be rounded to $0.00
    // and reported as "can never break even".
    const result = calculateBreakEven({
      fixedCosts: 100,
      pricePerUnit: 10.004,
      variableCostPerUnit: 10,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.contributionMarginPerUnit).toBeCloseTo(0.004, 6);
    expect(result.data.breakEvenUnits).toBeCloseTo(25_000, 0);
  });

  it("does not inflate a sub-cent margin by rounding it up", () => {
    // $0.005 margin must not round to $0.01, which would halve break-even units.
    const result = calculateBreakEven({
      fixedCosts: 100,
      pricePerUnit: 0.03,
      variableCostPerUnit: 0.025,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.breakEvenUnits).toBeCloseTo(20_000, 0);
  });

  it("computes break-even revenue as fixed costs over the contribution margin ratio", () => {
    const result = calculateBreakEven({
      fixedCosts: 10_000,
      pricePerUnit: 49.99,
      variableCostPerUnit: 30.01,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.breakEvenRevenue).toBeCloseTo(
      10_000 / result.data.contributionMarginRatio,
      6
    );
  });

  it("rejects a negative fixed costs value", () => {
    const result = calculateBreakEven({ fixedCosts: -100, pricePerUnit: 20, variableCostPerUnit: 10 });
    expect(result.ok).toBe(false);
  });

  it("rejects a zero or negative selling price", () => {
    const result = calculateBreakEven({ fixedCosts: 100, pricePerUnit: 0, variableCostPerUnit: 10 });
    expect(result.ok).toBe(false);
  });
});
