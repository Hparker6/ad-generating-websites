import { type CalculatorResult, fail, ok } from "../result.ts";
import { breakEvenInputSchema, type BreakEvenInput, type BreakEvenResult } from "./types.ts";

export function calculateBreakEven(input: unknown): CalculatorResult<BreakEvenResult> {
  const parsed = breakEvenInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message));
  }

  const { fixedCosts, pricePerUnit, variableCostPerUnit }: BreakEvenInput = parsed.data;
  const contributionMarginPerUnit = pricePerUnit - variableCostPerUnit;

  if (contributionMarginPerUnit <= 0) {
    return fail([
      "Selling price must be greater than variable cost per unit. Otherwise every sale loses money and no sales volume can ever break even.",
    ]);
  }

  const contributionMarginRatio = contributionMarginPerUnit / pricePerUnit;
  const breakEvenUnits = fixedCosts / contributionMarginPerUnit;

  return ok({
    contributionMarginPerUnit,
    contributionMarginRatio,
    breakEvenUnits,
    // Revenue at the exact (unrounded) break-even point, i.e. fixed costs
    // divided by the contribution margin ratio — the standard definition.
    breakEvenRevenue: breakEvenUnits * pricePerUnit,
  });
}
