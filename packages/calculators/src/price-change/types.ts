import { z } from "zod";

export const priceChangeInputSchema = z
  .object({
    currentPrice: z
      .number({ invalid_type_error: "Enter a valid current price." })
      .positive("Current price must be greater than 0.")
      .max(1_000_000, "Current price is too large."),
    unitCost: z
      .number({ invalid_type_error: "Enter a valid unit cost." })
      .min(0, "Unit cost can't be negative.")
      .max(1_000_000, "Unit cost is too large."),
    /** Signed: −20 is a 20% discount, +10 is a 10% price increase. */
    changePercent: z
      .number({ invalid_type_error: "Enter a valid percentage." })
      .gt(-100, "A price cut must be less than 100%.")
      .max(1_000, "Price change is too large."),
  })
  .refine((input) => input.unitCost < input.currentPrice, {
    message:
      "Unit cost must be below the current price — otherwise there's no profit per sale to compare against.",
    path: ["unitCost"],
  });

export type PriceChangeInput = z.infer<typeof priceChangeInputSchema>;

export interface PriceChangeResult {
  newPrice: number;
  currentProfitPerUnit: number;
  newProfitPerUnit: number;
  currentMarginPercent: number;
  /** Negative when the new price is below cost. */
  newMarginPercent: number;
  /**
   * How much unit volume has to change for total gross profit to stay the
   * same: positive means you must sell more (a discount), negative means you
   * can afford to sell less (an increase). Null when the new price is at or
   * below cost, because no volume restores profit then.
   */
  volumeChangeToBreakEvenPercent: number | null;
}
