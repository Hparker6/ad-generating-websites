/**
 * Typed analytics event helpers shared by every site. Event params are
 * deliberately narrow (ids, counts, booleans) so it is structurally
 * impossible to pass a user's entered values (bill amount, etc.) through
 * to GA4 by accident.
 */
export interface AnalyticsEventParams {
  calculator_complete: { calculator_id: string };
  calculator_error: { calculator_id: string; error_count: number };
  /** Which worked example was loaded, by position — never the values it sets. */
  preset_select: { calculator_id: string; preset_index: number };
  /** The cross-calculator journey, by id only. */
  next_step_click: { calculator_id: string; destination: string };
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
