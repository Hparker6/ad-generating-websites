import { type CalculatorResult, fail, ok } from "../result.ts";
import {
  contributionMarginInputSchema,
  type ContributionMarginInput,
  type ContributionMarginResult,
} from "./types.ts";

export function calculateContributionMargin(input: unknown): CalculatorResult<ContributionMarginResult> {
  const parsed = contributionMarginInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message));
  }

  const { sellingPrice, variableCost }: ContributionMarginInput = parsed.data;
  const contributionMarginPerUnit = sellingPrice - variableCost;
  const contributionMarginRatio = contributionMarginPerUnit / sellingPrice;

  return ok({ contributionMarginPerUnit, contributionMarginRatio });
}
