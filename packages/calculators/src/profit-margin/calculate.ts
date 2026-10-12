import { type CalculatorResult, fail, ok } from "../result.ts";
import { profitMarginInputSchema, type ProfitMarginInput, type ProfitMarginResult } from "./types.ts";

/**
 * Gross, operating, and net margin, per the standard income-statement
 * definitions (see docs/calculator-specs.md). Negative margins are a valid
 * answer — they mean a loss at that level.
 */
export function calculateProfitMargin(input: unknown): CalculatorResult<ProfitMarginResult> {
  const parsed = profitMarginInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message));
  }

  const { revenue, costOfGoodsSold, operatingExpenses, interestAndTaxes }: ProfitMarginInput = parsed.data;
  const grossProfit = revenue - costOfGoodsSold;
  const operatingProfit = grossProfit - operatingExpenses;
  const netProfit = operatingProfit - interestAndTaxes;

  return ok({
    grossProfit,
    grossMarginPercent: (grossProfit / revenue) * 100,
    operatingProfit,
    operatingMarginPercent: (operatingProfit / revenue) * 100,
    netProfit,
    netMarginPercent: (netProfit / revenue) * 100,
    markupPercent: costOfGoodsSold > 0 ? (grossProfit / costOfGoodsSold) * 100 : null,
  });
}
