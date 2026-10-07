import { describe, expect, it } from "vitest";
import { calculateBreakEven } from "../src/break-even/index.ts";
import { calculateContributionMargin } from "../src/contribution-margin/index.ts";
import { calculateMarkupMargin } from "../src/markup-margin/index.ts";
import { calculateSellingPrice } from "../src/selling-price/index.ts";
import { calculateTargetProfit } from "../src/target-profit/index.ts";

/**
 * Boundary and edge-case matrix. Every expected value below was worked out by
 * hand from the standard definition, not by running the implementation:
 *
 *   break-even units      = fixed / (price - variable cost)
 *   target-profit units   = (fixed + profit) / (price - variable cost)
 *   contribution margin   = price - variable cost
 *   markup %              = (price - cost) / cost * 100
 *   margin %              = (price - cost) / price * 100
 *   required price        = cost / (1 - margin/100)
 */

describe("break-even boundaries", () => {
  it("zero fixed costs break even at zero units", () => {
    const r = calculateBreakEven({ fixedCosts: 0, pricePerUnit: 50, variableCostPerUnit: 30 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.breakEvenUnits).toBe(0); // 0 / 20
      expect(r.data.breakEvenRevenue).toBe(0);
    }
  });

  it("price exactly equal to variable cost is rejected, not shown as infinity", () => {
    const r = calculateBreakEven({ fixedCosts: 10000, pricePerUnit: 30, variableCostPerUnit: 30 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/greater than variable cost/i);
  });

  it("price one cent above variable cost gives a finite, very large volume", () => {
    const r = calculateBreakEven({ fixedCosts: 1000, pricePerUnit: 30.01, variableCostPerUnit: 30 });
    expect(r.ok).toBe(true);
    // 1000 / 0.01 = 100,000 units exactly.
    if (r.ok) expect(r.data.breakEvenUnits).toBeCloseTo(100000, 4);
  });

  it("a fractional unit count is not silently rounded in the data layer", () => {
    const r = calculateBreakEven({ fixedCosts: 1000, pricePerUnit: 50, variableCostPerUnit: 27 });
    // 1000 / 23 = 43.478260869...
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.breakEvenUnits).toBeCloseTo(43.4782608696, 8);
  });

  it("the reported scenario: 1000 fixed, 50 price, 30 cost = 50 units", () => {
    const r = calculateBreakEven({ fixedCosts: 1000, pricePerUnit: 50, variableCostPerUnit: 30 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.breakEvenUnits).toBe(50);
      expect(r.data.breakEvenRevenue).toBe(2500);
      expect(r.data.contributionMarginRatio).toBeCloseTo(0.4, 10);
    }
  });

  it("values at the documented maximum are accepted; one step past is not", () => {
    expect(
      calculateBreakEven({ fixedCosts: 100_000_000, pricePerUnit: 50, variableCostPerUnit: 30 }).ok
    ).toBe(true);
    expect(
      calculateBreakEven({ fixedCosts: 100_000_001, pricePerUnit: 50, variableCostPerUnit: 30 }).ok
    ).toBe(false);
  });
});

describe("target profit boundaries", () => {
  it("a zero profit target equals the break-even volume", () => {
    const tp = calculateTargetProfit({
      fixedCosts: 10000, pricePerUnit: 50, variableCostPerUnit: 30, desiredProfit: 0,
    });
    const be = calculateBreakEven({ fixedCosts: 10000, pricePerUnit: 50, variableCostPerUnit: 30 });
    expect(tp.ok && be.ok).toBe(true);
    if (tp.ok && be.ok) expect(tp.data.requiredUnits).toBe(be.data.breakEvenUnits); // both 500
  });

  it("profit is treated as extra fixed cost", () => {
    const r = calculateTargetProfit({
      fixedCosts: 10000, pricePerUnit: 50, variableCostPerUnit: 30, desiredProfit: 4000,
    });
    expect(r.ok).toBe(true);
    // (10000 + 4000) / 20 = 700 units; 700 * 50 = 35,000 revenue.
    if (r.ok) {
      expect(r.data.requiredUnits).toBe(700);
      expect(r.data.requiredRevenue).toBe(35000);
    }
  });

  it("zero contribution margin is rejected rather than producing Infinity", () => {
    const r = calculateTargetProfit({
      fixedCosts: 100, pricePerUnit: 10, variableCostPerUnit: 10, desiredProfit: 100,
    });
    expect(r.ok).toBe(false);
  });
});

describe("contribution margin boundaries", () => {
  it("negative contribution is returned, not rejected — it is the useful answer", () => {
    const r = calculateContributionMargin({ sellingPrice: 10, variableCost: 30 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.contributionMarginPerUnit).toBe(-20); // 10 - 30
      expect(r.data.contributionMarginRatio).toBe(-2); // -20 / 10
    }
  });

  it("selling price equal to variable cost gives exactly zero, not -0", () => {
    const r = calculateContributionMargin({ sellingPrice: 30, variableCost: 30 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.contributionMarginPerUnit).toBe(0);
      expect(Object.is(r.data.contributionMarginPerUnit, -0)).toBe(false);
      expect(r.data.contributionMarginRatio).toBe(0);
    }
  });

  it("zero variable cost keeps the whole price", () => {
    const r = calculateContributionMargin({ sellingPrice: 50, variableCost: 0 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.contributionMarginRatio).toBe(1);
  });
});

describe("markup vs margin boundaries", () => {
  it("the canonical 60/100 example", () => {
    const r = calculateMarkupMargin({ unitCost: 60, sellingPrice: 100 });
    expect(r.ok).toBe(true);
    // profit 40; markup 40/60 = 66.666..%, margin 40/100 = 40%
    if (r.ok) {
      expect(r.data.profitPerUnit).toBe(40);
      expect(r.data.markupPercent).toBeCloseTo(66.6666666667, 8);
      expect(r.data.marginPercent).toBe(40);
    }
  });

  it("price equal to cost gives zero for both", () => {
    const r = calculateMarkupMargin({ unitCost: 50, sellingPrice: 50 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.markupPercent).toBe(0);
      expect(r.data.marginPercent).toBe(0);
    }
  });

  it("selling below cost gives negative markup and margin", () => {
    const r = calculateMarkupMargin({ unitCost: 100, sellingPrice: 80 });
    expect(r.ok).toBe(true);
    // profit -20; markup -20/100 = -20%, margin -20/80 = -25%
    if (r.ok) {
      expect(r.data.markupPercent).toBe(-20);
      expect(r.data.marginPercent).toBe(-25);
    }
  });

  it("a zero cost is rejected rather than dividing by zero", () => {
    expect(calculateMarkupMargin({ unitCost: 0, sellingPrice: 50 }).ok).toBe(false);
  });
});

describe("selling price boundaries", () => {
  it("a zero margin target returns the cost itself", () => {
    const r = calculateSellingPrice({ unitCost: 60, desiredMarginPercent: 0 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.requiredSellingPrice).toBe(60); // 60 / 1
      expect(r.data.equivalentMarkupPercent).toBe(0);
    }
  });

  it("40% margin on a 60 cost requires 100", () => {
    const r = calculateSellingPrice({ unitCost: 60, desiredMarginPercent: 40 });
    expect(r.ok).toBe(true);
    // 60 / 0.6 = 100; markup = 40/60 = 66.666..%
    if (r.ok) {
      expect(r.data.requiredSellingPrice).toBeCloseTo(100, 10);
      expect(r.data.equivalentMarkupPercent).toBeCloseTo(66.6666666667, 8);
    }
  });

  it("100% margin is rejected rather than returning Infinity", () => {
    const r = calculateSellingPrice({ unitCost: 60, desiredMarginPercent: 100 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/less than 100/i);
  });

  it("the 99.99% cap is accepted and stays finite", () => {
    const r = calculateSellingPrice({ unitCost: 60, desiredMarginPercent: 99.99 });
    expect(r.ok).toBe(true);
    // 60 / 0.0001 = 600,000
    if (r.ok) {
      expect(Number.isFinite(r.data.requiredSellingPrice)).toBe(true);
      expect(r.data.requiredSellingPrice).toBeCloseTo(600000, 2);
    }
  });

  it("markup and margin describe the same price (round-trip)", () => {
    const sp = calculateSellingPrice({ unitCost: 80, desiredMarginPercent: 35 });
    expect(sp.ok).toBe(true);
    if (!sp.ok) return;
    const mm = calculateMarkupMargin({ unitCost: 80, sellingPrice: sp.data.requiredSellingPrice });
    expect(mm.ok).toBe(true);
    if (mm.ok) {
      expect(mm.data.marginPercent).toBeCloseTo(35, 8);
      expect(mm.data.markupPercent).toBeCloseTo(sp.data.equivalentMarkupPercent, 8);
    }
  });
});

describe("cross-calculator agreement", () => {
  it("contribution margin feeds break-even consistently", () => {
    const cm = calculateContributionMargin({ sellingPrice: 50, variableCost: 30 });
    const be = calculateBreakEven({ fixedCosts: 10000, pricePerUnit: 50, variableCostPerUnit: 30 });
    expect(cm.ok && be.ok).toBe(true);
    if (cm.ok && be.ok) {
      expect(cm.data.contributionMarginPerUnit).toBe(be.data.contributionMarginPerUnit);
      // 10000 / 20 = 500
      expect(be.data.breakEvenUnits).toBe(10000 / cm.data.contributionMarginPerUnit);
    }
  });
});
