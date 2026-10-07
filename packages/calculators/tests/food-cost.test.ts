import { describe, expect, it } from "vitest";
import { calculateFoodCost } from "../src/food-cost/calculate";

describe("calculateFoodCost", () => {
  it("divides plate cost by the target food cost percentage", () => {
    // $4.50 plate at 30% food cost -> $15.00 menu price.
    const result = calculateFoodCost({ plateCost: 4.5, targetFoodCostPercent: 30 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.menuPrice).toBeCloseTo(15, 6);
    expect(result.data.grossProfitPerPlate).toBeCloseTo(10.5, 6);
    expect(result.data.equivalentMarkupPercent).toBeCloseTo(233.333, 2);
  });

  it("produces a price that realizes the target food cost", () => {
    const result = calculateFoodCost({ plateCost: 3.17, targetFoodCostPercent: 27.5 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((3.17 / result.data.menuPrice) * 100).toBeCloseTo(27.5, 6);
  });

  it("allows 100% food cost (price equals cost)", () => {
    const result = calculateFoodCost({ plateCost: 8, targetFoodCostPercent: 100 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.menuPrice).toBe(8);
    expect(result.data.grossProfitPerPlate).toBe(0);
  });

  it("rejects a food cost below 1%", () => {
    const result = calculateFoodCost({ plateCost: 4, targetFoodCostPercent: 0 });
    expect(result.ok).toBe(false);
  });

  it("rejects a zero plate cost", () => {
    const result = calculateFoodCost({ plateCost: 0, targetFoodCostPercent: 30 });
    expect(result.ok).toBe(false);
  });
});
