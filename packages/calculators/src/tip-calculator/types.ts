import { z } from "zod";

export const tipCalculatorInputSchema = z.object({
  billAmount: z
    .number({ invalid_type_error: "Enter a valid bill amount." })
    .positive("Bill amount must be greater than 0.")
    .max(1_000_000, "Bill amount is too large."),
  tipPercent: z
    .number({ invalid_type_error: "Enter a valid tip percentage." })
    .min(0, "Tip percentage can't be negative.")
    .max(100, "Tip percentage can't exceed 100%."),
  numPeople: z
    .number({ invalid_type_error: "Enter a valid number of people." })
    .int("Number of people must be a whole number.")
    .min(1, "At least 1 person is required.")
    .max(50, "Split between at most 50 people."),
});

export type TipCalculatorInput = z.infer<typeof tipCalculatorInputSchema>;

export interface TipCalculatorResult {
  tipAmount: number;
  totalAmount: number;
  perPersonTotal: number;
  perPersonTip: number;
}
