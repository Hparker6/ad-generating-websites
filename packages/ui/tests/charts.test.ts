import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHART_DIMENSIONS,
  breakEvenChartGeometry,
  priceSplitLayout,
  targetProfitLayout,
} from "../src/charts";

describe("breakEvenChartGeometry", () => {
  const input = {
    fixedCosts: 10_000,
    pricePerUnit: 50,
    variableCostPerUnit: 30,
    breakEvenUnits: 500,
  };

  it("places the break-even point at the horizontal centre of the plot", () => {
    const g = breakEvenChartGeometry(input);
    const centre = (g.plot.left + g.plot.right) / 2;
    expect(g.intersection.x).toBeCloseTo(centre, 6);
  });

  it("runs the revenue line from the bottom-left to the top-right corner", () => {
    const g = breakEvenChartGeometry(input);
    expect(g.revenue.from.x).toBeCloseTo(g.plot.left, 6);
    expect(g.revenue.from.y).toBeCloseTo(g.plot.bottom, 6);
    expect(g.revenue.to.x).toBeCloseTo(g.plot.right, 6);
    expect(g.revenue.to.y).toBeCloseTo(g.plot.top, 6);
  });

  it("starts the cost line at fixed costs on the Y axis", () => {
    const g = breakEvenChartGeometry(input);
    expect(g.cost.from.x).toBeCloseTo(g.plot.left, 6);
    // Fixed costs are 10,000 of a 50,000 Y axis -> 20% up from the bottom.
    const expected = g.plot.bottom - 0.2 * (g.plot.bottom - g.plot.top);
    expect(g.cost.from.y).toBeCloseTo(expected, 6);
  });

  it("keeps the cost line inside the plot area", () => {
    const g = breakEvenChartGeometry(input);
    expect(g.cost.to.y).toBeGreaterThanOrEqual(g.plot.top);
    expect(g.cost.to.y).toBeLessThanOrEqual(g.plot.bottom);
  });

  it("puts the two lines at the same point where they cross", () => {
    const g = breakEvenChartGeometry(input);
    // At the intersection x, both lines must share the intersection y.
    const t = (g.intersection.x - g.plot.left) / (g.plot.right - g.plot.left);
    const costY = g.cost.from.y + t * (g.cost.to.y - g.cost.from.y);
    const revenueY = g.revenue.from.y + t * (g.revenue.to.y - g.revenue.from.y);
    expect(costY).toBeCloseTo(g.intersection.y, 6);
    expect(revenueY).toBeCloseTo(g.intersection.y, 6);
  });

  it("falls back to a readable window when break-even is at zero units", () => {
    const g = breakEvenChartGeometry({
      fixedCosts: 0,
      pricePerUnit: 10,
      variableCostPerUnit: 4,
      breakEvenUnits: 0,
    });
    expect(g.xMaxUnits).toBe(10);
    expect(Number.isFinite(g.intersection.x)).toBe(true);
    expect(Number.isFinite(g.intersection.y)).toBe(true);
  });

  it("respects custom dimensions", () => {
    const g = breakEvenChartGeometry(input, { ...DEFAULT_CHART_DIMENSIONS, width: 1000 });
    expect(g.plot.right).toBe(1000 - DEFAULT_CHART_DIMENSIONS.padRight);
  });
});

describe("priceSplitLayout", () => {
  it("splits a price into cost and contribution shares", () => {
    const layout = priceSplitLayout(50, 30);
    expect(layout.costPercent).toBeCloseTo(60, 6);
    expect(layout.contributionPercent).toBeCloseTo(40, 6);
    expect(layout.isNegative).toBe(false);
    expect(layout.overflowPercent).toBe(0);
  });

  it("always fills the bar completely for a profitable unit", () => {
    const layout = priceSplitLayout(37.49, 11.11);
    expect(layout.costPercent + layout.contributionPercent).toBeCloseTo(100, 6);
  });

  it("reports the overflow when cost exceeds price", () => {
    const layout = priceSplitLayout(20, 30);
    expect(layout.isNegative).toBe(true);
    expect(layout.costPercent).toBe(100);
    expect(layout.contributionPercent).toBe(0);
    expect(layout.overflowPercent).toBeCloseTo(50, 6);
  });

  it("treats cost equal to price as a zero contribution, not an overflow", () => {
    const layout = priceSplitLayout(20, 20);
    expect(layout.isNegative).toBe(false);
    expect(layout.contributionPercent).toBeCloseTo(0, 6);
  });

  it("returns an empty layout for unusable inputs", () => {
    for (const layout of [priceSplitLayout(0, 10), priceSplitLayout(10, -1), priceSplitLayout(NaN, 1)]) {
      expect(layout.costPercent).toBe(0);
      expect(layout.contributionPercent).toBe(0);
    }
  });
});

describe("targetProfitLayout", () => {
  it("splits the amount to cover into fixed costs and desired profit", () => {
    const layout = targetProfitLayout({
      fixedCosts: 10_000,
      desiredProfit: 4_000,
      breakEvenUnits: 500,
      requiredUnits: 700,
    });
    expect(layout.fixedCostsPercent).toBeCloseTo((10 / 14) * 100, 6);
    expect(layout.desiredProfitPercent).toBeCloseTo((4 / 14) * 100, 6);
    expect(layout.fixedCostsPercent + layout.desiredProfitPercent).toBeCloseTo(100, 6);
  });

  it("splits required volume into break-even and profit-earning units", () => {
    const layout = targetProfitLayout({
      fixedCosts: 10_000,
      desiredProfit: 4_000,
      breakEvenUnits: 500,
      requiredUnits: 700,
    });
    expect(layout.breakEvenUnitsPercent).toBeCloseTo((500 / 700) * 100, 6);
    expect(layout.profitUnitsPercent).toBeCloseTo((200 / 700) * 100, 6);
  });

  it("handles a zero profit target (all volume just reaches break-even)", () => {
    const layout = targetProfitLayout({
      fixedCosts: 10_000,
      desiredProfit: 0,
      breakEvenUnits: 500,
      requiredUnits: 500,
    });
    expect(layout.desiredProfitPercent).toBeCloseTo(0, 6);
    expect(layout.breakEvenUnitsPercent).toBeCloseTo(100, 6);
    expect(layout.profitUnitsPercent).toBeCloseTo(0, 6);
  });

  it("never exceeds the bar when break-even already covers the target", () => {
    const layout = targetProfitLayout({
      fixedCosts: 10_000,
      desiredProfit: 0,
      breakEvenUnits: 900,
      requiredUnits: 500,
    });
    expect(layout.breakEvenUnitsPercent).toBe(100);
    expect(layout.profitUnitsPercent).toBe(0);
  });

  it("returns zeros when there is nothing to cover", () => {
    const layout = targetProfitLayout({
      fixedCosts: 0,
      desiredProfit: 0,
      breakEvenUnits: 0,
      requiredUnits: 0,
    });
    expect(layout.fixedCostsPercent).toBe(0);
    expect(layout.desiredProfitPercent).toBe(0);
    expect(layout.breakEvenUnitsPercent).toBe(0);
    expect(layout.profitUnitsPercent).toBe(0);
  });
});
