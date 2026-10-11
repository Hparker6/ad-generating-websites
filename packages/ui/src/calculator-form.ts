import { createCalculatorTracker, trackEvent } from "./analytics.ts";
import { readPrefillParams, wireCalculatorControls } from "./controls.ts";

/**
 * Structurally compatible with @repo/calculators' CalculatorResult<T>,
 * duck-typed here so this package doesn't need a hard dependency on
 * @repo/calculators just for a type shape.
 */
type CalculatorResultLike<T> = { ok: true; data: T } | { ok: false; errors: string[] };

export interface WireCalculatorFormOptions<T> {
  form: HTMLFormElement;
  errorsEl: HTMLElement;
  /**
   * The tool's URL slug, sent with every event. Defaults to the form's
   * `data-calculator-id` attribute, which pages set from the tool registry so
   * the id always matches the URL.
   */
  calculatorId?: string;
  calculate: (input: unknown) => CalculatorResultLike<T>;
  readInputs: () => unknown;
  renderResult: (data: T) => void;
  /**
   * The result region to mark as out of date while the inputs are invalid.
   * Defaults to the page's `.answer` element.
   */
  answerEl?: HTMLElement | null;
  /** Delay before a result is reported to analytics after the user stops typing. */
  debounceMs?: number;
}

/**
 * Wires a calculator form: recalculates and re-renders on every keystroke,
 * and reports the result to analytics once the user pauses (never the raw
 * input values). Which event that is — completion, adjustment, error — is
 * decided by createCalculatorTracker. Shared by every calculator page so each
 * one only has to supply readInputs/renderResult.
 */
export function wireCalculatorForm<T>(options: WireCalculatorFormOptions<T>): void {
  const { form, errorsEl, calculate, readInputs, renderResult, debounceMs = 400 } = options;
  const answerEl = options.answerEl ?? form.ownerDocument.querySelector<HTMLElement>(".answer");
  const calculatorId = options.calculatorId ?? form.dataset.calculatorId;
  if (!calculatorId) {
    throw new Error("wireCalculatorForm: set calculatorId or data-calculator-id on the form");
  }
  const tracker = createCalculatorTracker(calculatorId, trackEvent);

  let trackingTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingReport: (() => void) | undefined;

  // A link that carries inputs in its query string (shared by a reader, or
  // built by an AI agent) opens with those figures filled in. The address bar
  // is never rewritten as the reader types: analytics page views include the
  // URL, and typed values must never reach analytics. Sharing goes through the
  // explicit "copy link" button instead.
  const numberFields = Array.from(
    form.querySelectorAll<HTMLInputElement>('input[type="number"][id]')
  );
  const prefill = readPrefillParams(
    window.location.search,
    numberFields.map((field) => field.id)
  );
  for (const field of numberFields) {
    if (field.id in prefill) field.value = prefill[field.id];
  }

  function shareUrl(): string {
    const url = new URL(window.location.pathname, window.location.origin);
    for (const field of numberFields) {
      if (field.value.trim() !== "") url.searchParams.set(field.id, field.value.trim());
    }
    return url.toString();
  }

  const copyButton = form.querySelector<HTMLButtonElement>("[data-copy-link]");
  if (copyButton) {
    const idleLabel = copyButton.textContent ?? "";
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareUrl());
        copyButton.textContent = "Link copied";
        trackEvent("copy_link", { calculator_id: calculatorId });
      } catch {
        copyButton.textContent = "Couldn't copy — try again";
      }
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => (copyButton.textContent = idleLabel), 2500);
    });
  }

  function updateDisplay(): CalculatorResultLike<T> {
    const result = calculate(readInputs());
    // textContent, never innerHTML: error strings are our own, but clearing
    // this way keeps the element incapable of parsing markup by construction.
    errorsEl.textContent = "";

    if (!result.ok) {
      for (const message of result.errors) {
        const li = document.createElement("li");
        li.textContent = message;
        errorsEl.appendChild(li);
      }
      // The previous answer no longer describes what's in the form. Leaving it
      // looking authoritative next to an error invites someone to read a stale
      // figure as the result, so the headline figure is blanked and the
      // supporting rows are hidden until the input is valid again. Every one
      // of these is rewritten by renderResult on the next valid pass.
      if (answerEl) {
        answerEl.setAttribute("data-stale", "true");
        const value = answerEl.querySelector<HTMLElement>(".answer-value");
        if (value) value.textContent = "—";
        const sentence = answerEl.querySelector<HTMLElement>(".answer-sentence");
        if (sentence) sentence.textContent = "Check the highlighted input to see a result.";
      }
      return result;
    }

    answerEl?.removeAttribute("data-stale");
    renderResult(result.data);
    return result;
  }

  wireCalculatorControls(form, (presetIndex) => {
    trackEvent("preset_select", { calculator_id: calculatorId, preset_index: presetIndex });
  });

  // Every input event is a user interaction (typing, steppers, sliders, and
  // presets, which dispatch one). The result is reported after a pause, so
  // typing "120" is one report, not three.
  form.addEventListener("input", () => {
    const result = updateDisplay();
    clearTimeout(trackingTimer);
    pendingReport = () => {
      pendingReport = undefined;
      tracker.userResult(result.ok ? { ok: true } : { ok: false, errorCount: result.errors.length });
    };
    trackingTimer = setTimeout(pendingReport, debounceMs);
  });

  // Leaving mid-pause would otherwise drop the report; send it now instead.
  window.addEventListener("pagehide", () => {
    clearTimeout(trackingTimer);
    pendingReport?.();
  });

  // Browsers restore typed form values on back/forward navigation without
  // firing an input event, which would otherwise leave the restored inputs
  // sitting next to a stale server-rendered answer.
  window.addEventListener("pageshow", () => {
    updateDisplay();
  });

  const initial = updateDisplay();
  const prefilledCount = Object.keys(prefill).length;
  if (prefilledCount > 0 && initial.ok) {
    tracker.prefilledView(prefilledCount);
  }
}
