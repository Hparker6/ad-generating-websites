import { z } from "zod";

export const contributionMarginInputSchema = z.object({
  sellingPrice: z
    .number({ invalid_type_error: "Enter a valid selling price." })
    .positive("Selling price must be greater than 0.")
    .max(1_000_000, "Selling price is too large."),
  variableCost: z
    .number({ invalid_type_error: "Enter a valid variable cost." })
    .min(0, "Variable cost can't be negative.")
    .max(1_000_000, "Variable cost is too large."),
});

export type ContributionMarginInput = z.infer<typeof contributionMarginInputSchema>;

export interface ContributionMarginResult {
  /** Can be negative if variable cost exceeds selling price — that's valid, informative output. */
  contributionMarginPerUnit: number;
  /** As a fraction of selling price; can be negative. */
  contributionMarginRatio: number;
}
