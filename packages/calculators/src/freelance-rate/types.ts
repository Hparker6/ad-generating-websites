import { z } from "zod";

export const freelanceRateInputSchema = z.object({
  targetIncome: z
    .number({ invalid_type_error: "Enter a valid take-home income." })
    .min(0, "Take-home income can't be negative.")
    .max(10_000_000, "Take-home income is too large."),
  annualExpenses: z
    .number({ invalid_type_error: "Enter valid annual business expenses." })
    .min(0, "Business expenses can't be negative.")
    .max(10_000_000, "Business expenses are too large."),
  taxRatePercent: z
    .number({ invalid_type_error: "Enter a valid tax rate." })
    .min(0, "Tax rate can't be negative.")
    .max(90, "Tax rate must be 90% or less."),
  billableHoursPerWeek: z
    .number({ invalid_type_error: "Enter valid billable hours per week." })
    .positive("Billable hours per week must be greater than 0.")
    .max(100, "Billable hours per week must be 100 or less."),
  weeksPerYear: z
    .number({ invalid_type_error: "Enter valid working weeks per year." })
    .positive("Working weeks per year must be greater than 0.")
    .max(52, "There are only 52 weeks in a year."),
});

export type FreelanceRateInput = z.infer<typeof freelanceRateInputSchema>;

export interface FreelanceRateResult {
  hourlyRate: number;
  /** Hourly rate × 8 — the conventional full-day quote. */
  dayRate: number;
  /** Revenue needed to cover expenses, tax, and the take-home target. */
  annualRevenueNeeded: number;
  billableHoursPerYear: number;
  /** Estimated tax on the profit (revenue − expenses). */
  estimatedTax: number;
}
