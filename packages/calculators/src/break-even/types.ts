import { z } from "zod";

export const breakEvenInputSchema = z.object({
  fixedCosts: z
    .number({ invalid_type_error: "Enter a valid fixed costs amount." })
    .min(0, "Fixed costs can't be negative.")
    .max(100_000_000, "Fixed costs is too large."),
  pricePerUnit: z
    .number({ invalid_type_error: "Enter a valid selling price." })
    .positive("Selling price must be greater than 0.")
    .max(1_000_000, "Selling price is too large."),
  variableCostPerUnit: z
    .number({ invalid_type_error: "Enter a valid variable cost per unit." })
    .min(0, "Variable cost can't be negative.")
    .max(1_000_000, "Variable cost is too large."),
});

export type BreakEvenInput = z.infer<typeof breakEvenInputSchema>;

export interface BreakEvenResult {
  /** Selling price minus variable cost per unit. */
  contributionMarginPerUnit: number;
  /** Contribution margin as a fraction of price (0–1). */
  contributionMarginRatio: number;
  /** Exact units needed to break even (not rounded up). */
  breakEvenUnits: number;
  breakEvenRevenue: number;
}
