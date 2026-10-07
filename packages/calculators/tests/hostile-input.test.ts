import { describe, expect, it } from "vitest";
import { calculateBreakEven } from "../src/break-even/index.ts";
import { calculateContributionMargin } from "../src/contribution-margin/index.ts";
import { calculateMarkupMargin } from "../src/markup-margin/index.ts";
import { calculateSellingPrice } from "../src/selling-price/index.ts";
import { calculateTargetProfit } from "../src/target-profit/index.ts";
import { calculatePriceChange } from "../src/price-change/index.ts";
import { calculateFreelanceRate } from "../src/freelance-rate/index.ts";
import { calculateFoodCost } from "../src/food-cost/index.ts";

/**
 * Every calculator takes `unknown` and is the last line of defence between a
 * browser input and the arithmetic. These tests assert the boundary holds for
 * values the UI should never produce but that a hostile or broken caller can:
 * non-finite numbers, wrong types, and strings shaped like markup.
 *
 * Expected values here are written independently (by hand, from the standard
 * definitions) rather than by calling the implementation.
 */

const CALCULATORS = [
  {
    name: "break-even",
    run: calculateBreakEven,
    valid: { fixedCosts: 10000, pricePerUnit: 50, variableCostPerUnit: 30 },
  },
  {
    name: "target-profit",
    run: calculateTargetProfit,
    valid: { fixedCosts: 10000, pricePerUnit: 50, variableCostPerUnit: 30, desiredProfit: 4000 },
  },
  {
    name: "contribution-margin",
    run: calculateContributionMargin,
    valid: { sellingPrice: 50, variableCost: 30 },
  },
  {
    name: "markup-margin",
    run: calculateMarkupMargin,
    valid: { unitCost: 60, sellingPrice: 100 },
  },
  {
    name: "selling-price",
    run: calculateSellingPrice,
    valid: { unitCost: 60, desiredMarginPercent: 40 },
  },
  {
    name: "price-change",
    run: calculatePriceChange,
    valid: { currentPrice: 100, unitCost: 60, changePercent: -20 },
  },
  {
    name: "freelance-rate",
    run: calculateFreelanceRate,
    valid: { targetIncome: 75000, annualExpenses: 10000, taxRatePercent: 25, billableHoursPerWeek: 25, weeksPerYear: 46 },
  },
  {
    name: "food-cost",
    run: calculateFoodCost,
    valid: { plateCost: 4.5, targetFoodCostPercent: 30 },
  },
] as const;

/** Values that must never be accepted in place of a number. */
const HOSTILE_VALUES: [label: string, value: unknown][] = [
  ["NaN", Number.NaN],
  ["Infinity", Number.POSITIVE_INFINITY],
  ["-Infinity", Number.NEGATIVE_INFINITY],
  ["null", null],
  ["undefined", undefined],
  ["empty string", ""],
  ["whitespace string", "   "],
  ["numeric string", "50"],
  ["array", [50]],
  ["object", { valueOf: () => 50 }],
  ["boolean", true],
  ["script tag", "<script>alert(1)</script>"],
  ["img onerror", '"><img src=x onerror=alert(1)>'],
  ["javascript: url", "javascript:alert(1)"],
  ["svg onload", "'><svg/onload=alert(1)>"],
  ["html entities", "&lt;script&gt;alert(1)&lt;/script&gt;"],
  ["percent-encoded", "%3Cscript%3Ealert(1)%3C/script%3E"],
  ["very long digit string", "9".repeat(5000)],
  ["exponential overflow", 1e999],
  ["bigint-ish string", "999999999999999999999999"],
  ["hex string", "0x10"],
  ["thousands separators", "1,000"],
  ["fullwidth digits", "１２３"],
  ["__proto__ string", "__proto__"],
];

describe("calculator input boundary rejects hostile values", () => {
  for (const calc of CALCULATORS) {
    const fields = Object.keys(calc.valid);
    for (const field of fields) {
      for (const [label, value] of HOSTILE_VALUES) {
        it(`${calc.name}: rejects ${label} for ${field}`, () => {
          const result = calc.run({ ...calc.valid, [field]: value } as unknown);
          expect(result.ok, `${label} was accepted for ${field}`).toBe(false);
          if (!result.ok) {
            expect(result.errors.length).toBeGreaterThan(0);
            // Error strings are our own copy, never an echo of the input, so
            // nothing the caller supplied can reach the DOM through them.
            const asText = String(value);
            for (const message of result.errors) {
              expect(message).not.toContain("<");
              expect(message).not.toContain(">");
              expect(message.toLowerCase()).not.toContain("script");
              if (asText.trim().length >= 4) expect(message).not.toContain(asText);
            }
          }
        });
      }
    }
  }
});

describe("missing and extra fields", () => {
  for (const calc of CALCULATORS) {
    it(`${calc.name}: rejects an empty object`, () => {
      expect(calc.run({}).ok).toBe(false);
    });
    it(`${calc.name}: rejects a non-object`, () => {
      expect(calc.run("not an object").ok).toBe(false);
      expect(calc.run(null).ok).toBe(false);
      expect(calc.run([]).ok).toBe(false);
    });
    it(`${calc.name}: a __proto__ key does not pollute Object.prototype`, () => {
      calc.run(JSON.parse('{"__proto__":{"polluted":true}}'));
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
  }
});

describe("prototype integrity after a full run", () => {
  it("does not leave Object.prototype modified", () => {
    for (const calc of CALCULATORS) calc.run(calc.valid);
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, "polluted")).toBe(false);
  });
});
