import { type CalculatorResult, fail, ok } from "../result.ts";
import { sellingPriceInputSchema, type SellingPriceInput, type SellingPriceResult } from "./types.ts";

export function calculateSellingPrice(input: unknown): CalculatorResult<SellingPriceResult> {
  const parsed = sellingPriceInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message));
  }

  const { unitCost, desiredMarginPercent }: SellingPriceInput = parsed.data;
  const requiredSellingPrice = unitCost / (1 - desiredMarginPercent / 100);
  // Derived from the exact price, not the cents-rounded display value, so
  // markup and margin always describe the same price.
  const equivalentMarkupPercent = ((requiredSellingPrice - unitCost) / unitCost) * 100;

  return ok({ requiredSellingPrice, equivalentMarkupPercent });
}
