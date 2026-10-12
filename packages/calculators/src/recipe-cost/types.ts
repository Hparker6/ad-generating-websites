import { z } from "zod";

export const ingredientSchema = z.object(
  {
    packagePrice: z
      .number({ invalid_type_error: "Enter a valid package price." })
      .min(0, "Package price can't be negative.")
      .max(1_000_000, "Package price is too large."),
    packageSize: z
      .number({ invalid_type_error: "Enter a valid package size." })
      .positive("Package size must be greater than 0.")
      .max(1_000_000_000, "Package size is too large."),
    amountUsed: z
      .number({ invalid_type_error: "Enter a valid amount used." })
      .min(0, "Amount used can't be negative.")
      .max(1_000_000_000, "Amount used is too large."),
    yieldPercent: z
      .number({ invalid_type_error: "Enter a valid yield percentage." })
      .min(1, "Yield must be at least 1%.")
      .max(100, "Yield can't be more than 100%."),
  },
  { invalid_type_error: "Enter each ingredient's price, package size, and amount used." }
);

export const recipeCostInputSchema = z.object({
  ingredients: z
    .array(ingredientSchema, { invalid_type_error: "Add at least one ingredient." })
    .min(1, "Add at least one ingredient.")
    .max(50, "That's too many ingredients."),
  servings: z
    .number({ invalid_type_error: "Enter a valid number of servings." })
    .positive("Servings must be greater than 0.")
    .max(100_000, "That's too many servings."),
  /** Optional: when set, a suggested menu price per serving is returned. */
  targetFoodCostPercent: z
    .number({ invalid_type_error: "Enter a valid target food cost percentage." })
    .min(1, "Target food cost must be at least 1%.")
    .max(100, "Target food cost can't be more than 100%.")
    .optional(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;
export type RecipeCostInput = z.infer<typeof recipeCostInputSchema>;

export interface RecipeCostResult {
  /** Edible-portion cost of each ingredient, in input order. */
  ingredientCosts: number[];
  batchCost: number;
  costPerServing: number;
  /** Null when no target food cost was given. */
  suggestedMenuPrice: number | null;
}
