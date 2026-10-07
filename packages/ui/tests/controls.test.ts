import { describe, expect, it } from "vitest";
import { readNumericField, readPrefillParams } from "../src/controls.ts";

/**
 * readNumericField is the fix for a confirmed defect: a browser blanks
 * `input.value` for anything it cannot parse as a number (letters, an
 * out-of-range exponent like 1e999), and `Number("")` is 0 — so clearing a
 * field used to produce a confident answer of 0 instead of a validation error.
 *
 * A minimal Document stand-in keeps this a pure unit test; the same behaviour
 * is covered end to end by the Playwright security suite.
 */
function docWith(values: Record<string, string>): Document {
  return {
    getElementById: (id: string) => (id in values ? { value: values[id] } : null),
  } as unknown as Document;
}

describe("readNumericField", () => {
  it("returns NaN for an empty field rather than 0", () => {
    expect(readNumericField("a", docWith({ a: "" }))).toBeNaN();
  });

  it("returns NaN for a whitespace-only field", () => {
    expect(readNumericField("a", docWith({ a: "   " }))).toBeNaN();
  });

  it("returns NaN for a missing field", () => {
    expect(readNumericField("nope", docWith({}))).toBeNaN();
  });

  it("still reads a typed zero as 0", () => {
    expect(readNumericField("a", docWith({ a: "0" }))).toBe(0);
    expect(readNumericField("a", docWith({ a: "0.00" }))).toBe(0);
  });

  it("reads ordinary and decimal values", () => {
    expect(readNumericField("a", docWith({ a: "10000" }))).toBe(10000);
    expect(readNumericField("a", docWith({ a: "30.01" }))).toBe(30.01);
    expect(readNumericField("a", docWith({ a: "-5" }))).toBe(-5);
  });

  it("tolerates surrounding whitespace on a real value", () => {
    expect(readNumericField("a", docWith({ a: " 42 " }))).toBe(42);
  });

  it("returns NaN for non-numeric text, which the schemas then reject", () => {
    expect(readNumericField("a", docWith({ a: "abc" }))).toBeNaN();
    expect(readNumericField("a", docWith({ a: "1,000" }))).toBeNaN();
    expect(readNumericField("a", docWith({ a: "<script>" }))).toBeNaN();
  });

  it("returns a non-finite number for an overflowing exponent, which .max() rejects", () => {
    // A browser normally blanks this before it is read; if it ever survives,
    // Infinity fails every schema's max bound rather than reaching the maths.
    expect(readNumericField("a", docWith({ a: "1e999" }))).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("readPrefillParams", () => {
  const fields = ["unitCost", "sellingPrice"];

  it("returns plain numeric values for known fields", () => {
    expect(readPrefillParams("?unitCost=60&sellingPrice=100.5", fields)).toEqual({
      unitCost: "60",
      sellingPrice: "100.5",
    });
  });

  it("ignores fields the form doesn't have", () => {
    expect(readPrefillParams("?other=5&unitCost=7", fields)).toEqual({ unitCost: "7" });
  });

  it("ignores anything that isn't a plain decimal number", () => {
    const hostile = [
      "abc",
      "1e999",
      "0x10",
      "1,000",
      "<script>",
      "Infinity",
      "",
      "9".repeat(50),
    ];
    for (const value of hostile) {
      expect(readPrefillParams(`?unitCost=${encodeURIComponent(value)}`, fields)).toEqual({});
    }
  });

  it("allows negatives and leading-dot decimals, leaving range checks to the schema", () => {
    expect(readPrefillParams("?unitCost=-5&sellingPrice=.5", fields)).toEqual({
      unitCost: "-5",
      sellingPrice: ".5",
    });
  });
});
