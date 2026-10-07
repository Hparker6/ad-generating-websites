import { z } from "zod";

export const targetProfitInputSchema = z.object({
  fixedCosts: z
    .number({ invalid_type_error: "Enter a valid fixed costs amount." })
    .min(0, "Fixed costs can't be negative.")
    .max(100_000_000, "Fixed costs is too large."),
  variableCostPerUnit: z
    .number({ invalid_type_error: "Enter a valid variable cost per unit." })
    .min(0, "Variable cost can't be negative.")
    .max(1_000_000, "Variable cost is too large."),
  pricePerUnit: z
    .number({ invalid_type_error: "Enter a valid selling price." })
    .positive("Selling price must be greater than 0.")
    .max(1_000_000, "Selling price is too large."),
  desiredProfit: z
    .number({ invalid_type_error: "Enter a valid desired profit." })
    .min(0, "Desired profit can't be negative.")
    .max(1_000_000_000, "Desired profit is too large."),
});

export type TargetProfitInput = z.infer<typeof targetProfitInputSchema>;

export interface TargetProfitResult {
  contributionMarginPerUnit: number;
  requiredUnits: number;
  requiredRevenue: number;
}
