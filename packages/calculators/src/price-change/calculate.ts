import { type CalculatorResult, fail, ok } from "../result.ts";
import { priceChangeInputSchema, type PriceChangeInput, type PriceChangeResult } from "./types.ts";

export function calculatePriceChange(input: unknown): CalculatorResult<PriceChangeResult> {
  const parsed = priceChangeInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message));
  }

  const { currentPrice, unitCost, changePercent }: PriceChangeInput = parsed.data;
  const newPrice = currentPrice * (1 + changePercent / 100);
  const currentProfitPerUnit = currentPrice - unitCost;
  const newProfitPerUnit = newPrice - unitCost;

  // Same total profit: oldVolume × oldProfit = newVolume × newProfit.
  const volumeChangeToBreakEvenPercent =
    newProfitPerUnit > 0 ? (currentProfitPerUnit / newProfitPerUnit - 1) * 100 : null;

  return ok({
    newPrice,
    currentProfitPerUnit,
    newProfitPerUnit,
    currentMarginPercent: (currentProfitPerUnit / currentPrice) * 100,
    newMarginPercent: (newProfitPerUnit / newPrice) * 100,
    volumeChangeToBreakEvenPercent,
  });
}
