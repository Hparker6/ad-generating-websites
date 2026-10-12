import { type CalculatorResult, fail, ok } from "../result.ts";
import { recipeCostInputSchema, type RecipeCostInput, type RecipeCostResult } from "./types.ts";

/**
 * Recipe costing by the as-purchased / edible-portion method (see
 * docs/calculator-specs.md): each ingredient's share of its package price,
 * divided by its yield to account for trim and waste.
 */
export function calculateRecipeCost(input: unknown): CalculatorResult<RecipeCostResult> {
  const parsed = recipeCostInputSchema.safeParse(input);
  if (!parsed.success) {
    // Name the row, so "Ingredient 3: Enter a valid package size." points
    // the cook at the right line instead of a bare field name.
    return fail(
      parsed.error.issues.map((issue) => {
        const [field, row] = issue.path;
        return field === "ingredients" && typeof row === "number"
          ? `Ingredient ${row + 1}: ${issue.message}`
          : issue.message;
      })
    );
  }

  const { ingredients, servings, targetFoodCostPercent }: RecipeCostInput = parsed.data;
  const ingredientCosts = ingredients.map(
    ({ packagePrice, packageSize, amountUsed, yieldPercent }) =>
      (packagePrice * amountUsed) / packageSize / (yieldPercent / 100)
  );
  const batchCost = ingredientCosts.reduce((sum, cost) => sum + cost, 0);
  const costPerServing = batchCost / servings;

  return ok({
    ingredientCosts,
    batchCost,
    costPerServing,
    suggestedMenuPrice:
      targetFoodCostPercent === undefined ? null : costPerServing / (targetFoodCostPercent / 100),
  });
}
