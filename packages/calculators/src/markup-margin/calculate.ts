import { type CalculatorResult, fail, ok } from "../result.ts";
import { markupMarginInputSchema, type MarkupMarginInput, type MarkupMarginResult } from "./types.ts";

export function calculateMarkupMargin(input: unknown): CalculatorResult<MarkupMarginResult> {
  const parsed = markupMarginInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message));
  }

  const { unitCost, sellingPrice }: MarkupMarginInput = parsed.data;
  const profit = sellingPrice - unitCost;

  return ok({
    markupPercent: (profit / unitCost) * 100,
    marginPercent: (profit / sellingPrice) * 100,
    profitPerUnit: profit,
  });
}
