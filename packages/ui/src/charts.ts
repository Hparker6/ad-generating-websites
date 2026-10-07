/**
 * Pure geometry helpers for the calculator visuals. These contain the only
 * real logic behind the charts, so they live here (testable) rather than
 * inline in page scripts. They never touch the DOM.
 */

export interface ChartDimensions {
  width: number;
  height: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  padBottom: number;
}

/**
 * Wide and shallow: the chart spans the full content column, and the right
 * padding leaves room to label each line directly instead of using a legend.
 */
export const DEFAULT_CHART_DIMENSIONS: ChartDimensions = {
  width: 760,
  height: 330,
  padLeft: 54,
  padRight: 88,
  padTop: 26,
  padBottom: 40,
};

export interface Point {
  x: number;
  y: number;
}

export interface BreakEvenChartGeometry {
  /** Revenue line: starts at the origin. */
  revenue: { from: Point; to: Point };
  /** Total cost line: starts at fixed costs on the Y axis. */
  cost: { from: Point; to: Point };
  /** Where the two lines cross — the break-even point. */
  intersection: Point;
  /** Plot area bounds, for axes and shading. */
  plot: { left: number; right: number; top: number; bottom: number };
  /** Axis maxima in domain units, for tick labels. */
  xMaxUnits: number;
  yMaxDollars: number;
}

export interface BreakEvenChartInput {
  fixedCosts: number;
  pricePerUnit: number;
  variableCostPerUnit: number;
  breakEvenUnits: number;
}

/**
 * Lays out the revenue and total-cost lines so the break-even point always
 * sits at the horizontal centre of the plot, with the revenue line running
 * corner to corner. That keeps the chart readable for any input scale.
 *
 * Because break-even units = fixedCosts / (price - variableCost), revenue at
 * twice that volume always exceeds total cost by exactly the fixed costs, so
 * neither line can escape the plot area.
 */
export function breakEvenChartGeometry(
  input: BreakEvenChartInput,
  dimensions: ChartDimensions = DEFAULT_CHART_DIMENSIONS
): BreakEvenChartGeometry {
  const { fixedCosts, pricePerUnit, variableCostPerUnit, breakEvenUnits } = input;
  const { width, height, padLeft, padRight, padTop, padBottom } = dimensions;

  const plot = {
    left: padLeft,
    right: width - padRight,
    top: padTop,
    bottom: height - padBottom,
  };
  const plotWidth = plot.right - plot.left;
  const plotHeight = plot.bottom - plot.top;

  // Fall back to a readable window when break-even is at zero units.
  const xMaxUnits = breakEvenUnits > 0 && Number.isFinite(breakEvenUnits) ? breakEvenUnits * 2 : 10;
  const yMaxDollars = Math.max(pricePerUnit * xMaxUnits, 1);

  const toX = (units: number) => plot.left + (units / xMaxUnits) * plotWidth;
  const toY = (dollars: number) => plot.bottom - (dollars / yMaxDollars) * plotHeight;

  return {
    revenue: {
      from: { x: toX(0), y: toY(0) },
      to: { x: toX(xMaxUnits), y: toY(pricePerUnit * xMaxUnits) },
    },
    cost: {
      from: { x: toX(0), y: toY(fixedCosts) },
      to: { x: toX(xMaxUnits), y: toY(fixedCosts + variableCostPerUnit * xMaxUnits) },
    },
    intersection: {
      x: toX(breakEvenUnits > 0 ? breakEvenUnits : 0),
      y: toY(breakEvenUnits > 0 ? pricePerUnit * breakEvenUnits : 0),
    },
    plot,
    xMaxUnits,
    yMaxDollars,
  };
}

export interface PriceSplitLayout {
  /** Share of the bar taken by variable/unit cost, 0–100. */
  costPercent: number;
  /** Share left over as contribution/profit, 0–100. */
  contributionPercent: number;
  /** True when cost exceeds the selling price (loss on every unit). */
  isNegative: boolean;
  /** How far cost overshoots the price, as a percentage of price. */
  overflowPercent: number;
}

/**
 * Splits a selling price into its cost and contribution parts for a stacked
 * bar. When cost exceeds price the cost fills the bar and the excess is
 * reported separately, so a loss-making unit reads as obviously wrong
 * instead of silently clamping to a full bar.
 */
export function priceSplitLayout(price: number, cost: number): PriceSplitLayout {
  if (!Number.isFinite(price) || !Number.isFinite(cost) || price <= 0 || cost < 0) {
    return { costPercent: 0, contributionPercent: 0, isNegative: false, overflowPercent: 0 };
  }

  const costShare = (cost / price) * 100;

  if (costShare > 100) {
    return {
      costPercent: 100,
      contributionPercent: 0,
      isNegative: true,
      overflowPercent: costShare - 100,
    };
  }

  return {
    costPercent: costShare,
    contributionPercent: 100 - costShare,
    isNegative: false,
    overflowPercent: 0,
  };
}

export interface TargetProfitLayout {
  /** Share of the "amount to cover" bar that is fixed costs, 0–100. */
  fixedCostsPercent: number;
  /** Share of that bar that is the desired profit, 0–100. */
  desiredProfitPercent: number;
  /** Share of the required volume that merely reaches break-even, 0–100. */
  breakEvenUnitsPercent: number;
  /** Share of the required volume that produces the profit, 0–100. */
  profitUnitsPercent: number;
}

/**
 * Lays out the two target-profit bars: what has to be covered (fixed costs
 * plus the profit goal) and how the required volume divides into reaching
 * break-even versus earning the profit on top.
 */
export function targetProfitLayout(input: {
  fixedCosts: number;
  desiredProfit: number;
  breakEvenUnits: number;
  requiredUnits: number;
}): TargetProfitLayout {
  const { fixedCosts, desiredProfit, breakEvenUnits, requiredUnits } = input;

  const amountToCover = fixedCosts + desiredProfit;
  const fixedCostsPercent = amountToCover > 0 ? (fixedCosts / amountToCover) * 100 : 0;

  const breakEvenUnitsPercent =
    requiredUnits > 0 ? Math.min((breakEvenUnits / requiredUnits) * 100, 100) : 0;

  return {
    fixedCostsPercent,
    desiredProfitPercent: amountToCover > 0 ? 100 - fixedCostsPercent : 0,
    breakEvenUnitsPercent,
    profitUnitsPercent: requiredUnits > 0 ? 100 - breakEvenUnitsPercent : 0,
  };
}
