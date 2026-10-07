import { describe, expect, it } from "vitest";
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatCurrency,
  formatPercent,
} from "../src/format";

describe("formatCurrency", () => {
  it("formats to cents with a leading sign", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
    expect(formatCurrency(-10)).toBe("-$10.00");
  });

  it("shows extra precision for sub-cent values rather than collapsing to $0.00", () => {
    expect(formatCurrency(0.004)).toBe("$0.0040");
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("formatCompactCurrency", () => {
  it("abbreviates thousands and millions for axis labels", () => {
    expect(formatCompactCurrency(950)).toBe("$950");
    expect(formatCompactCurrency(1_500)).toBe("$1.5K");
    expect(formatCompactCurrency(18_909)).toBe("$19K");
    expect(formatCompactCurrency(1_250_000)).toBe("$1.3M");
    expect(formatCompactCurrency(25_000_000)).toBe("$25M");
  });

  it("keeps the sign on negative values", () => {
    expect(formatCompactCurrency(-2_000)).toBe("-$2.0K");
  });
});

describe("formatCompactNumber", () => {
  it("keeps small counts exact and abbreviates large ones", () => {
    expect(formatCompactNumber(728)).toBe("728");
    expect(formatCompactNumber(9_999)).toBe("9,999");
    expect(formatCompactNumber(25_000)).toBe("25K");
    expect(formatCompactNumber(2_400_000)).toBe("2.4M");
  });
});

describe("formatPercent", () => {
  it("converts a fraction to a percentage string", () => {
    expect(formatPercent(0.4)).toBe("40.0%");
    expect(formatPercent(-0.5)).toBe("-50.0%");
  });
});
