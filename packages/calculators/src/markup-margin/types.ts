import { z } from "zod";

export const markupMarginInputSchema = z.object({
  unitCost: z
    .number({ invalid_type_error: "Enter a valid unit cost." })
    .positive("Unit cost must be greater than 0.")
    .max(1_000_000, "Unit cost is too large."),
  sellingPrice: z
    .number({ invalid_type_error: "Enter a valid selling price." })
    .positive("Selling price must be greater than 0.")
    .max(1_000_000, "Selling price is too large."),
});

export type MarkupMarginInput = z.infer<typeof markupMarginInputSchema>;

export interface MarkupMarginResult {
  /** (price - cost) / cost. Can be negative if selling below cost. */
  markupPercent: number;
  /** (price - cost) / price. Can be negative if selling below cost. */
  marginPercent: number;
  /** The shared numerator of both percentages. Negative when selling below cost. */
  profitPerUnit: number;
}
