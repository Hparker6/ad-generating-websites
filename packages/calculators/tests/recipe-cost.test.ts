import { describe, expect, it } from "vitest";
import { calculateRecipeCost } from "../src/recipe-cost/calculate";

const row = (packagePrice: number, packageSize: number, amountUsed: number, yieldPercent = 100) => ({
  packagePrice,
  packageSize,
  amountUsed,
  yieldPercent,
});

// Cases from docs/calculator-specs.md, computed by hand.
describe("calculateRecipeCost", () => {
  it("costs each ingredient, the batch, and a serving", () => {
    const result = calculateRecipeCost({
      ingredients: [row(4, 2000, 500), row(5, 454, 113), row(3.6, 12, 3)],
      servings: 8,
      targetFoodCostPercent: 30,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.ingredientCosts[0]).toBeCloseTo(1.0, 10);
    expect(result.data.ingredientCosts[1]).toBeCloseTo(1.24449, 4);
    expect(result.data.ingredientCosts[2]).toBeCloseTo(0.9, 10);
    expect(result.data.batchCost).toBeCloseTo(3.14449, 4);
    expect(result.data.costPerServing).toBeCloseTo(0.393062, 5);
    expect(result.data.suggestedMenuPrice).toBeCloseTo(1.31021, 4);
  });

  it("divides by yield to get the edible-portion cost (CIA method)", () => {
    const carrots = calculateRecipeCost({ ingredients: [row(2, 1000, 300, 80)], servings: 1 });
    expect(carrots.ok).toBe(true);
    if (!carrots.ok) return;
    expect(carrots.data.ingredientCosts[0]).toBeCloseTo(0.75, 10);
  });

  it("matches the BCcampus beef tenderloin yield example", () => {
    // $21.00/lb as purchased at 70% yield → $30.00/lb edible portion.
    const beef = calculateRecipeCost({ ingredients: [row(21, 1, 1, 70)], servings: 1 });
    expect(beef.ok).toBe(true);
    if (!beef.ok) return;
    expect(beef.data.ingredientCosts[0]).toBeCloseTo(30, 10);
  });

  it("returns no menu price without a target food cost", () => {
    const result = calculateRecipeCost({ ingredients: [row(4, 2000, 500)], servings: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.suggestedMenuPrice).toBeNull();
  });

  it("allows an ingredient with zero amount used", () => {
    const result = calculateRecipeCost({ ingredients: [row(4, 2000, 0)], servings: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.batchCost).toBe(0);
  });

  it("names the row in validation errors", () => {
    const result = calculateRecipeCost({
      ingredients: [row(4, 2000, 500), row(5, 0, 113)],
      servings: 4,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(["Ingredient 2: Package size must be greater than 0."]);
  });

  it("rejects yield outside 1–100%, zero servings, and an empty recipe", () => {
    expect(calculateRecipeCost({ ingredients: [row(1, 1, 1, 0)], servings: 1 }).ok).toBe(false);
    expect(calculateRecipeCost({ ingredients: [row(1, 1, 1, 101)], servings: 1 }).ok).toBe(false);
    expect(calculateRecipeCost({ ingredients: [row(1, 1, 1)], servings: 0 }).ok).toBe(false);
    const empty = calculateRecipeCost({ ingredients: [], servings: 1 });
    expect(empty.ok).toBe(false);
    if (empty.ok) return;
    expect(empty.errors[0]).toMatch(/at least one ingredient/);
  });
});
