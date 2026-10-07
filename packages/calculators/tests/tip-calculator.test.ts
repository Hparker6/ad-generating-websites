import { describe, expect, it } from "vitest";
import { calculateTip } from "../src/tip-calculator/calculate";

describe("calculateTip", () => {
  it("computes tip, total, and per-person splits", () => {
    const result = calculateTip({ billAmount: 100, tipPercent: 20, numPeople: 4 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({
      tipAmount: 20,
      totalAmount: 120,
      perPersonTotal: 30,
      perPersonTip: 5,
    });
  });

  it("handles a zero tip", () => {
    const result = calculateTip({ billAmount: 50, tipPercent: 0, numPeople: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.tipAmount).toBe(0);
    expect(result.data.totalAmount).toBe(50);
  });

  it("rounds to the nearest cent", () => {
    const result = calculateTip({ billAmount: 33.33, tipPercent: 18, numPeople: 3 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 33.33 * 0.18 = 5.9994 -> 6.00
    expect(result.data.tipAmount).toBe(6);
    expect(result.data.totalAmount).toBe(39.33);
    expect(result.data.perPersonTotal).toBe(13.11);
  });

  it("rejects a negative bill amount", () => {
    const result = calculateTip({ billAmount: -10, tipPercent: 10, numPeople: 1 });
    expect(result.ok).toBe(false);
  });

  it("rejects zero people", () => {
    const result = calculateTip({ billAmount: 10, tipPercent: 10, numPeople: 0 });
    expect(result.ok).toBe(false);
  });

  it("rejects a non-integer number of people", () => {
    const result = calculateTip({ billAmount: 10, tipPercent: 10, numPeople: 2.5 });
    expect(result.ok).toBe(false);
  });

  it("rejects a tip percent above 100", () => {
    const result = calculateTip({ billAmount: 10, tipPercent: 150, numPeople: 1 });
    expect(result.ok).toBe(false);
  });

  it("rejects missing fields entirely", () => {
    const result = calculateTip({});
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
