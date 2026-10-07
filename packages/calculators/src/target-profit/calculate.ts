import { type CalculatorResult, fail, ok } from "../result.ts";
import { targetProfitInputSchema, type TargetProfitInput, type TargetProfitResult } from "./types.ts";

export function calculateTargetProfit(input: unknown): CalculatorResult<TargetProfitResult> {
  const parsed = targetProfitInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message));
  }

  const { fixedCosts, variableCostPerUnit, pricePerUnit, desiredProfit }: TargetProfitInput = parsed.data;
  const contributionMarginPerUnit = pricePerUnit - variableCostPerUnit;

  if (contributionMarginPerUnit <= 0) {
    return fail([
      "Selling price must be greater than variable cost per unit. With zero or negative contribution margin, no amount of volume can reach a profit target.",
    ]);
  }

  const requiredUnits = (fixedCosts + desiredProfit) / contributionMarginPerUnit;

  return ok({
    contributionMarginPerUnit,
    requiredUnits,
    // Revenue at the exact (unrounded) required volume.
    requiredRevenue: requiredUnits * pricePerUnit,
  });
}
