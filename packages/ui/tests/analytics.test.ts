import { describe, expect, it } from "vitest";
import { createCalculatorTracker, type AnalyticsEventName } from "../src/analytics.ts";
import { toolIdFromPath } from "../src/link-tracking.ts";

function recorder() {
  const sent: [AnalyticsEventName, Record<string, unknown>][] = [];
  const send = (name: AnalyticsEventName, params: Record<string, unknown>) => sent.push([name, params]);
  return { sent, send, names: () => sent.map(([name]) => name) };
}

const ok = { ok: true } as const;
const bad = (errorCount = 1) => ({ ok: false, errorCount }) as const;

describe("createCalculatorTracker", () => {
  it("sends calculator_complete once, then numbered calculator_adjust events", () => {
    const r = recorder();
    const t = createCalculatorTracker("markup-vs-margin", r.send);
    t.userResult(ok);
    t.userResult(ok);
    t.userResult(ok);
    expect(r.sent).toEqual([
      ["calculator_complete", { calculator_id: "markup-vs-margin" }],
      ["calculator_adjust", { calculator_id: "markup-vs-margin", adjustment_count: 1 }],
      ["calculator_adjust", { calculator_id: "markup-vs-margin", adjustment_count: 2 }],
    ]);
  });

  it("sends nothing until the user interacts — page load alone is not a completion", () => {
    const r = recorder();
    createCalculatorTracker("break-even", r.send);
    expect(r.sent).toEqual([]);
  });

  it("reports a prefilled result separately, once, and still counts the first edit as the completion", () => {
    const r = recorder();
    const t = createCalculatorTracker("discount-calculator", r.send);
    t.prefilledView(2);
    t.prefilledView(2);
    t.userResult(ok);
    expect(r.sent).toEqual([
      ["prefilled_result_view", { calculator_id: "discount-calculator", prefilled_field_count: 2 }],
      ["calculator_complete", { calculator_id: "discount-calculator" }],
    ]);
  });

  it("ignores a prefill with no fields applied", () => {
    const r = recorder();
    createCalculatorTracker("food-cost-calculator", r.send).prefilledView(0);
    expect(r.sent).toEqual([]);
  });

  it("reports an error once per episode, not for every keystroke while invalid", () => {
    const r = recorder();
    const t = createCalculatorTracker("selling-price", r.send);
    t.userResult(bad(1));
    t.userResult(bad(2));
    t.userResult(ok);
    t.userResult(bad(1));
    expect(r.names()).toEqual(["calculator_error", "calculator_complete", "calculator_error"]);
    expect(r.sent[0][1]).toEqual({ calculator_id: "selling-price", error_count: 1 });
  });

  it("an error before the first valid result doesn't use up the completion", () => {
    const r = recorder();
    const t = createCalculatorTracker("target-profit", r.send);
    t.userResult(bad());
    t.userResult(ok);
    t.userResult(ok);
    expect(r.names()).toEqual(["calculator_error", "calculator_complete", "calculator_adjust"]);
  });

  it("never sends anything but ids, counts, and positions", () => {
    const r = recorder();
    const t = createCalculatorTracker("freelance-hourly-rate", r.send);
    t.prefilledView(3);
    t.userResult(bad(2));
    t.userResult(ok);
    t.userResult(ok);
    for (const [, params] of r.sent) {
      for (const [key, value] of Object.entries(params)) {
        expect(["calculator_id", "prefilled_field_count", "error_count", "adjustment_count"]).toContain(key);
        if (key !== "calculator_id") expect(Number.isInteger(value)).toBe(true);
      }
    }
  });
});

describe("toolIdFromPath", () => {
  it("uses the URL slug as the tool id", () => {
    expect(toolIdFromPath("/markup-vs-margin")).toBe("markup-vs-margin");
    expect(toolIdFromPath("/markup-margin-chart/")).toBe("markup-margin-chart");
    expect(toolIdFromPath("/break-even.html")).toBe("break-even");
    expect(toolIdFromPath("/")).toBe("home");
  });
});
