import { describe, expect, it } from "vitest";
import { calculateTargetProfit } from "../src/target-profit/calculate";

describe("calculateTargetProfit", () => {
  it("computes required units and revenue for a normal case", () => {
    const result = calculateTargetProfit({
      fixedCosts: 10_000,
      variableCostPerUnit: 30,
      pricePerUnit: 50,
      desiredProfit: 4_000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.contributionMarginPerUnit).toBe(20);
    expect(result.data.requiredUnits).toBe(700);
    expect(result.data.requiredRevenue).toBe(35_000);
  });

  it("allows a desired profit of zero (equivalent to break-even)", () => {
    const result = calculateTargetProfit({
      fixedCosts: 1000,
      variableCostPerUnit: 5,
      pricePerUnit: 15,
      desiredProfit: 0,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.requiredUnits).toBe(100);
  });

  it("rejects a negative desired profit", () => {
    const result = calculateTargetProfit({
      fixedCosts: 1000,
      variableCostPerUnit: 5,
      pricePerUnit: 15,
      desiredProfit: -1,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a zero or negative contribution margin", () => {
    const result = calculateTargetProfit({
      fixedCosts: 1000,
      variableCostPerUnit: 20,
      pricePerUnit: 20,
      desiredProfit: 500,
    });
    expect(result.ok).toBe(false);
  });
});
