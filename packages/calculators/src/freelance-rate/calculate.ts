import { type CalculatorResult, fail, ok } from "../result.ts";
import {
  freelanceRateInputSchema,
  type FreelanceRateInput,
  type FreelanceRateResult,
} from "./types.ts";

export function calculateFreelanceRate(input: unknown): CalculatorResult<FreelanceRateResult> {
  const parsed = freelanceRateInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message));
  }

  const { targetIncome, annualExpenses, taxRatePercent, billableHoursPerWeek, weeksPerYear }: FreelanceRateInput =
    parsed.data;

  // Tax falls on profit, so the pre-tax profit needed is income ÷ (1 − rate);
  // expenses are then added back on top to get revenue.
  const preTaxProfit = targetIncome / (1 - taxRatePercent / 100);
  const annualRevenueNeeded = preTaxProfit + annualExpenses;
  const billableHoursPerYear = billableHoursPerWeek * weeksPerYear;
  const hourlyRate = annualRevenueNeeded / billableHoursPerYear;

  return ok({
    hourlyRate,
    dayRate: hourlyRate * 8,
    annualRevenueNeeded,
    billableHoursPerYear,
    estimatedTax: preTaxProfit - targetIncome,
  });
}
