import { type CalculatorResult, fail, ok } from "../result.ts";
import { foodCostInputSchema, type FoodCostInput, type FoodCostResult } from "./types.ts";

export function calculateFoodCost(input: unknown): CalculatorResult<FoodCostResult> {
  const parsed = foodCostInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message));
  }

  const { plateCost, targetFoodCostPercent }: FoodCostInput = parsed.data;
  const menuPrice = plateCost / (targetFoodCostPercent / 100);
  const grossProfitPerPlate = menuPrice - plateCost;

  return ok({
    menuPrice,
    grossProfitPerPlate,
    equivalentMarkupPercent: (grossProfitPerPlate / plateCost) * 100,
  });
}
