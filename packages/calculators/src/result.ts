/**
 * Shared result shape for every calculator. Using a discriminated union
 * (instead of throwing) keeps error handling in the UI layer explicit and
 * makes it easy to report a generic error *type* to analytics without ever
 * touching the user's actual input values.
 */
export type CalculatorResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

export function ok<T>(data: T): CalculatorResult<T> {
  return { ok: true, data };
}

export function fail<T>(errors: string[]): CalculatorResult<T> {
  return { ok: false, errors };
}

/**
 * Rounds to cents, half away from zero, correcting for binary float
 * representation (1.005 is stored as 1.00499…, which would otherwise round
 * down). Never returns -0.
 *
 * Calculators should round only their final currency outputs — never
 * intermediate values — so rounding error can't compound into the math.
 */
export function roundCurrency(value: number): number {
  const scaled = value * 100;
  const nudged = scaled + Math.sign(scaled) * Math.abs(scaled) * Number.EPSILON;
  const rounded = (Math.sign(nudged) * Math.round(Math.abs(nudged))) / 100;
  return rounded === 0 ? 0 : rounded;
}
