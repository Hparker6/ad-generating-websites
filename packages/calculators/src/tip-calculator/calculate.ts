import { type CalculatorResult, fail, ok, roundCurrency } from "../result.ts";
import { tipCalculatorInputSchema, type TipCalculatorInput, type TipCalculatorResult } from "./types.ts";

export function calculateTip(input: unknown): CalculatorResult<TipCalculatorResult> {
  const parsed = tipCalculatorInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message));
  }

  const { billAmount, tipPercent, numPeople }: TipCalculatorInput = parsed.data;

  const tipAmount = roundCurrency(billAmount * (tipPercent / 100));
  const totalAmount = roundCurrency(billAmount + tipAmount);
  const perPersonTotal = roundCurrency(totalAmount / numPeople);
  const perPersonTip = roundCurrency(tipAmount / numPeople);

  return ok({
    tipAmount,
    totalAmount,
    perPersonTotal,
    perPersonTip,
  });
}
