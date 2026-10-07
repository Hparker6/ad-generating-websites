# Adding a new calculator

Calculator logic lives in `packages/calculators`, completely separate from
any UI. A calculator is: a zod input schema, a pure `calculate()` function
returning a `CalculatorResult<T>`, and unit tests.

## 1. Create the folder

```
packages/calculators/src/my-calculator/
  types.ts        # zod schema + input/output TypeScript types
  calculate.ts     # the pure function
  index.ts         # re-exports both
```

`types.ts`:

```ts
import { z } from "zod";

export const myCalculatorInputSchema = z.object({
  someValue: z.number({ invalid_type_error: "Enter a valid number." }).positive("Must be greater than 0."),
});

export type MyCalculatorInput = z.infer<typeof myCalculatorInputSchema>;

export interface MyCalculatorResult {
  someOutput: number;
}
```

`calculate.ts`:

```ts
import { type CalculatorResult, fail, ok } from "../result.ts";
import { myCalculatorInputSchema, type MyCalculatorInput, type MyCalculatorResult } from "./types.ts";

export function calculateMyCalculator(input: unknown): CalculatorResult<MyCalculatorResult> {
  const parsed = myCalculatorInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message));
  }
  const { someValue }: MyCalculatorInput = parsed.data;
  return ok({ someOutput: someValue * 2 });
}
```

`index.ts`:

```ts
export * from "./calculate.ts";
export * from "./types.ts";
```

**Note the explicit `.ts` extensions on every relative import.** Astro's
dev server loads site config (and anything it imports) via Node's native
TypeScript execution, which — unlike Vite's bundler resolution used for
page rendering — requires exact file extensions on relative specifiers.
Leaving them off works in a production build but breaks `astro dev`.

## 2. Add an export entry

Edit `packages/calculators/package.json` and add a subpath:

```json
"exports": {
  ".": "./src/index.ts",
  "./my-calculator": "./src/my-calculator/index.ts"
}
```

(A generic `"./*": "./src/*"` wildcard doesn't work here because a bare
subpath like `./my-calculator` would resolve to the directory
`./src/my-calculator`, not its `index.ts` — Node's exports resolution
doesn't do automatic directory-index lookup for pattern-matched exports.)

## 3. Export it from the barrel

Add a line to `packages/calculators/src/index.ts`:

```ts
export * from "./my-calculator/index.ts";
```

## 4. Write tests

Add `packages/calculators/tests/my-calculator.test.ts` covering: a normal
case, relevant edge cases (zero, boundary values), and at least one invalid
input. Look at `packages/calculators/tests/break-even.test.ts` for the
pattern — test the normal math, a zero/boundary case, and an explicitly
rejected input with a specific error message.

```bash
pnpm --filter @repo/calculators test
```

## 5. Use it from a page

```astro
<script>
  import { calculateMyCalculator } from "@repo/calculators/my-calculator";
  import { wireCalculatorForm } from "@repo/ui";
  // see any page under sites/pricing-calculators/src/pages/ for the full pattern
</script>
```

Calculator logic never touches the DOM or analytics directly — that's the
whole point of the separation. `wireCalculatorForm` (in `@repo/ui`) is the
only piece that knows about forms and analytics events, and it works with
any calculator whose `calculate()` returns a `CalculatorResult<T>`.
