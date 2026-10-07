import { z } from "zod";

export const sellingPriceInputSchema = z.object({
  unitCost: z
    .number({ invalid_type_error: "Enter a valid unit cost." })
    .positive("Unit cost must be greater than 0.")
    .max(1_000_000, "Unit cost is too large."),
  desiredMarginPercent: z
    .number({ invalid_type_error: "Enter a valid desired margin percentage." })
    .min(0, "Desired margin can't be negative.")
    .max(99.99, "Desired margin must be less than 100% — at 100% the required price would be infinite."),
});

export type SellingPriceInput = z.infer<typeof sellingPriceInputSchema>;

export interface SellingPriceResult {
  requiredSellingPrice: number;
  /** The markup percentage (over cost) that this price works out to. */
  equivalentMarkupPercent: number;
}
