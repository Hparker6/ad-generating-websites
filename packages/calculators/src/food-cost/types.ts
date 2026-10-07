import { z } from "zod";

export const foodCostInputSchema = z.object({
  plateCost: z
    .number({ invalid_type_error: "Enter a valid ingredient cost." })
    .positive("Ingredient cost must be greater than 0.")
    .max(100_000, "Ingredient cost is too large."),
  targetFoodCostPercent: z
    .number({ invalid_type_error: "Enter a valid food cost percentage." })
    .min(1, "Target food cost must be at least 1%.")
    .max(100, "Target food cost can't be more than 100%."),
});

export type FoodCostInput = z.infer<typeof foodCostInputSchema>;

export interface FoodCostResult {
  menuPrice: number;
  grossProfitPerPlate: number;
  /** The markup over ingredient cost that this menu price works out to. */
  equivalentMarkupPercent: number;
}
