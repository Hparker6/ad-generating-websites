import { z } from "zod";

/** A non-negative money input; `label` is used mid-sentence, `Label` to start one. */
const money = (label: string, Label: string) =>
  z
    .number({ invalid_type_error: `Enter a valid ${label}.` })
    .min(0, `${Label} can't be negative.`)
    .max(1_000_000_000_000, `${Label} is too large.`);

export const profitMarginInputSchema = z.object({
  revenue: z
    .number({ invalid_type_error: "Enter a valid revenue." })
    .positive("Revenue must be greater than 0.")
    .max(1_000_000_000_000, "Revenue is too large."),
  costOfGoodsSold: money("cost of goods sold", "Cost of goods sold"),
  operatingExpenses: money("operating expenses amount", "Operating expenses"),
  interestAndTaxes: money("interest and taxes amount", "Interest and taxes"),
});

export type ProfitMarginInput = z.infer<typeof profitMarginInputSchema>;

export interface ProfitMarginResult {
  grossProfit: number;
  grossMarginPercent: number;
  operatingProfit: number;
  operatingMarginPercent: number;
  netProfit: number;
  netMarginPercent: number;
  /** Gross profit as a percentage of COGS; null when COGS is zero. */
  markupPercent: number | null;
}
