/**
 * Typed analytics event helpers shared by every site. Event params are
 * deliberately narrow (ids, counts, internal paths) so it is structurally
 * impossible to pass a user's entered values through to GA4 by accident.
 *
 * Every event's meaning is documented in docs/analytics.md — keep the two in
 * step. `calculator_id` is always the tool's URL slug, e.g. "markup-vs-margin".
 */
export interface AnalyticsEventParams {
  /** First valid result after a user interaction — at most once per page view. */
  calculator_complete: { calculator_id: string };
  /** Each later valid result in the same page view; count starts at 1. */
  calculator_adjust: { calculator_id: string; adjustment_count: number };
  /** Inputs became invalid after a user interaction — once per error episode. */
  calculator_error: { calculator_id: string; error_count: number };
  /** Arrived via a link carrying inputs and a valid result was shown, untouched. */
  prefilled_result_view: { calculator_id: string; prefilled_field_count: number };
  /** Which worked example was loaded, by position — never the values it sets. */
  preset_select: { calculator_id: string; preset_index: number };
  /** "Copy link to this result" succeeded. The link itself is never sent. */
  copy_link: { calculator_id: string };
  /** The "Next step" link at the foot of a tool page. */
  next_step_click: { calculator_id: string; destination: string };
  /** A card in the "Related calculators" block. */
  related_tool_click: { calculator_id: string; destination: string };
}

export type AnalyticsEventName = keyof AnalyticsEventParams;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent<K extends AnalyticsEventName>(
  name: K,
  params: AnalyticsEventParams[K]
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  window.gtag("event", name, params);
}

export type SendEvent = <K extends AnalyticsEventName>(name: K, params: AnalyticsEventParams[K]) => void;

export interface CalculatorTracker {
  /** Call once on load when URL inputs were applied and produced a valid result. */
  prefilledView(fieldCount: number): void;
  /** Call (debounced) with the result state after a user interaction. */
  userResult(result: { ok: true } | { ok: false; errorCount: number }): void;
}

/**
 * The per-page-view rules for calculator events, kept free of DOM and timers
 * so they can be unit-tested:
 *
 * - Loading a page never counts as a completion, even with prefilled inputs;
 *   that case is `prefilled_result_view`, sent at most once.
 * - The first valid result after an interaction is `calculator_complete`;
 *   every later valid result is `calculator_adjust` with a running count.
 * - An error is reported when the inputs go from valid (or untouched) to
 *   invalid, not again for each keystroke while they stay invalid.
 */
export function createCalculatorTracker(calculatorId: string, send: SendEvent): CalculatorTracker {
  let completed = false;
  let adjustments = 0;
  let inError = false;
  let prefillReported = false;

  return {
    prefilledView(fieldCount) {
      if (prefillReported || fieldCount < 1) return;
      prefillReported = true;
      send("prefilled_result_view", { calculator_id: calculatorId, prefilled_field_count: fieldCount });
    },
    userResult(result) {
      if (!result.ok) {
        if (!inError) {
          inError = true;
          send("calculator_error", { calculator_id: calculatorId, error_count: result.errorCount });
        }
        return;
      }
      inError = false;
      if (!completed) {
        completed = true;
        send("calculator_complete", { calculator_id: calculatorId });
      } else {
        adjustments += 1;
        send("calculator_adjust", { calculator_id: calculatorId, adjustment_count: adjustments });
      }
    },
  };
}
