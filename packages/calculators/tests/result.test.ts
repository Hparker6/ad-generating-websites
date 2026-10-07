import { describe, expect, it } from "vitest";
import { roundCurrency } from "../src/result";

describe("roundCurrency", () => {
  it("rounds to two decimals", () => {
    expect(roundCurrency(1.234)).toBe(1.23);
    expect(roundCurrency(1.236)).toBe(1.24);
  });

  it("rounds half away from zero, correcting float representation", () => {
    // 1.005 is stored as 1.00499…, which naive rounding sends down.
    expect(roundCurrency(1.005)).toBe(1.01);
    expect(roundCurrency(-1.005)).toBe(-1.01);
  });

  it("never returns negative zero", () => {
    expect(Object.is(roundCurrency(-0.001), 0)).toBe(true);
    expect(Object.is(roundCurrency(-0), 0)).toBe(true);
  });

  it("cleans up float noise from subtraction", () => {
    expect(roundCurrency(50 - 29.99)).toBe(20.01);
  });
});
