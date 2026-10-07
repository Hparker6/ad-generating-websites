/**
 * Progressive-enhancement wiring for calculator inputs: preset buttons,
 * +/- steppers, and sliders paired with a number field. All of it is
 * optional — a page that uses none of these markup hooks is unaffected, and
 * the plain number inputs keep working if this script never runs.
 *
 * Markup contract:
 *   <button data-preset='{"inputId": 123}'>          applies those values
 *   <button data-step-for="inputId" data-step-delta="100">
 *   <input type="range" data-sync-with="inputId">
 */

function dispatchInput(target: HTMLElement): void {
  target.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Reads a numeric form field as a number for validation.
 *
 * Returns NaN — never 0 — when the field is empty or whitespace. A browser
 * blanks `input.value` for anything it can't parse as a number (text, an
 * out-of-range exponent like 1e999), so `Number(value)` would otherwise turn
 * every one of those cases into a confident, wrong 0. NaN is rejected by the
 * calculators' schemas, which surface "Enter a valid …" instead.
 *
 * A typed 0 still reads as 0, because "0" is not empty.
 */
export function readNumericField(id: string, doc: Document = document): number {
  const el = doc.getElementById(id) as HTMLInputElement | null;
  if (!el) return Number.NaN;
  const raw = el.value.trim();
  if (raw === "") return Number.NaN;
  return Number(raw);
}

/**
 * Picks prefill values for calculator fields out of a URL query string, so a
 * link like `/markup-vs-margin?unitCost=60&sellingPrice=100` opens with those
 * inputs filled in. Only ids in `fieldIds` are considered, and only plain
 * finite decimal numbers are returned — anything else in the URL is ignored
 * rather than written into the form.
 */
export function readPrefillParams(search: string, fieldIds: readonly string[]): Record<string, string> {
  const params = new URLSearchParams(search);
  const prefill: Record<string, string> = {};
  for (const id of fieldIds) {
    const raw = params.get(id)?.trim();
    if (!raw || raw.length > 20 || !/^-?\d*\.?\d+$/.test(raw)) continue;
    if (!Number.isFinite(Number(raw))) continue;
    prefill[id] = raw;
  }
  return prefill;
}

/** Avoids 0.1 + 0.2 style drift when stepping decimal values. */
function roundToStep(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function clampToInput(input: HTMLInputElement, value: number): number {
  const min = input.min === "" ? Number.NEGATIVE_INFINITY : Number(input.min);
  const max = input.max === "" ? Number.POSITIVE_INFINITY : Number(input.max);
  return Math.min(Math.max(value, min), max);
}

export function wireCalculatorControls(
  form: HTMLFormElement,
  /** Fired when a preset is applied, with its position only — never its values. */
  onPresetSelect?: (presetIndex: number) => void
): void {
  const sliders = Array.from(
    form.querySelectorAll<HTMLInputElement>('input[type="range"][data-sync-with]')
  );

  /** Keeps each slider's thumb in step with its number field. */
  function syncSliders(): void {
    for (const slider of sliders) {
      const target = form.querySelector<HTMLInputElement>(`#${slider.dataset.syncWith}`);
      if (target && slider.value !== target.value) {
        slider.value = target.value;
      }
    }
  }

  for (const slider of sliders) {
    slider.addEventListener("input", () => {
      const target = form.querySelector<HTMLInputElement>(`#${slider.dataset.syncWith}`);
      if (!target) return;
      target.value = slider.value;
      dispatchInput(target);
    });
  }

  for (const button of form.querySelectorAll<HTMLButtonElement>("[data-step-for]")) {
    button.addEventListener("click", () => {
      const target = form.querySelector<HTMLInputElement>(`#${button.dataset.stepFor}`);
      if (!target) return;
      const delta = Number(button.dataset.stepDelta ?? 1);
      const current = Number(target.value);
      const next = clampToInput(target, roundToStep((Number.isFinite(current) ? current : 0) + delta));
      target.value = String(next);
      syncSliders();
      dispatchInput(target);
    });
  }

  const presetButtons = Array.from(form.querySelectorAll<HTMLButtonElement>("[data-preset]"));

  for (const [presetIndex, button] of presetButtons.entries()) {
    button.addEventListener("click", () => {
      let values: Record<string, number>;
      try {
        values = JSON.parse(button.dataset.preset ?? "{}");
      } catch {
        return;
      }
      onPresetSelect?.(presetIndex);

      for (const [id, value] of Object.entries(values)) {
        const target = form.querySelector<HTMLInputElement>(`#${id}`);
        if (target) target.value = String(value);
      }

      for (const other of presetButtons) {
        other.setAttribute("aria-pressed", String(other === button));
      }

      syncSliders();
      dispatchInput(form);
    });
  }

  // Typing into a field by hand means the result no longer matches a preset.
  form.addEventListener("input", (event) => {
    if (event.target instanceof HTMLInputElement) {
      for (const button of presetButtons) {
        button.setAttribute("aria-pressed", "false");
      }
    }
    syncSliders();
  });

  // Covers back/forward restores, where number fields come back with their
  // previous values but sliders would otherwise keep the server-rendered one.
  window.addEventListener("pageshow", syncSliders);

  syncSliders();
}
