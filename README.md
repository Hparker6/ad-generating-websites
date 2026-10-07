# ad-website-thing

A monorepo for a portfolio of small, independent, SEO-focused utility
websites. Each site is a standalone static [Astro](https://astro.build) app
deployed to its own [Cloudflare Pages](https://pages.cloudflare.com/) project
— nothing routes multiple domains through one runtime. Shared UI, calculator
logic, and SEO helpers live in versionless workspace packages so adding a
new site is mostly "write content," not "write infrastructure."

## Architecture

```
sites/                  One folder per deployable website (independent Astro project)
  example-calculator/      Generic demo site (tip calculator) — a template, not a real niche
  pricing-calculators/     Live site #1: small-business pricing/break-even calculators
packages/
  ui/                      Shared Astro components, CSS, client-side helpers (analytics, forms)
  calculators/             Pure, framework-free calculator logic + unit tests
  seo/                     Site config schema, meta tag builders, structured data (JSON-LD)
scripts/                  Repo-wide helper scripts (config validation, placeholder images)
.github/workflows/        CI: per-site build + deploy, path-filtered
```

Key decisions:

- **pnpm workspaces, no build orchestrator.** `packages/*` export raw
  `.ts`/`.astro` source via `package.json` `exports` — there's no compile
  step for shared packages, so there's no "forgot to rebuild the package"
  bug class.
- **Each site is fully independent.** Its own `package.json`,
  `astro.config.mjs`, static output, Cloudflare Pages project, and domain.
  You could delete every other site and this one would still build and
  deploy.
- **Config fails the build, not the page.** Each site's `site.config.ts`
  calls `validateSiteConfig()` at module load time, which is imported by
  `astro.config.mjs` — a missing/invalid required field throws before a
  single page renders.
- **No UI framework.** Calculators use a small vanilla `<script
  type="module">` (via the shared `wireCalculatorForm` helper) — no React/
  Vue/Svelte hydration cost.
- **Domain-optional by design.** A site's `domain` can be `null` ("not
  purchased yet"). In that state the whole site is forced to `noindex` and
  `robots.txt` disallows all crawling — see [Domains & canonical
  URLs](#domains--canonical-urls-handling-no-domain-yet) below.

## Local development

```bash
pnpm install              # once, from the repo root
pnpm --filter site-pricing-calculators dev     # or site-example-calculator
```

Astro's dev server defaults to `http://localhost:4321` (it'll pick another
port if that one's busy — check the terminal output).

Useful repo-wide commands (run from the root):

| Command | What it does |
|---|---|
| `pnpm run test` | Runs all unit tests (`packages/calculators`, `packages/seo`) |
| `pnpm run build` | Builds every site under `sites/*` |
| `pnpm run validate` | Validates every site's config without a full build |
| `pnpm run typecheck` | Type-checks every package and site |
| `pnpm --filter <pkg-name> <script>` | Runs one workspace package's script, e.g. `pnpm --filter site-pricing-calculators build` |

## Domains & canonical URLs (handling "no domain yet")

A site's `domain` field in `site.config.ts` can be `null`. `@repo/seo`'s
`resolveOrigin()` picks the base URL in this priority order:

1. The real `domain`, once set.
2. `CF_PAGES_URL` — set automatically by Cloudflare Pages for **every**
   build, including preview deploys. No setup needed.
3. `http://localhost:4321` as a last-resort local fallback.

Whenever `domain` is `null`, `isProductionReady()` is `false`, which forces:

- Every page's `<meta name="robots">` to `noindex, nofollow`, regardless of
  any per-page setting.
- `robots.txt` to `Disallow: /` instead of `Allow: /`.

This means a preview deploy or local build can never get indexed under a
throwaway URL, and nothing in the repo ever hardcodes a fake "permanent"
domain. Once you set the real domain (see [Configuring a site for
launch](#configuring-a-site-for-launch)), indexing turns back on
automatically — no other file needs to change.

## Configuring a site for launch

Each site reads its domain and GA4 ID from environment variables, with a
safe placeholder when unset. Set these in the Cloudflare Pages project's
**Settings → Environment variables** (or locally in a `.env` file the site
loads, or inline when running a build):

| Variable | Effect when set |
|---|---|
| `PUBLIC_SITE_DOMAIN` | Bare hostname, e.g. `thebusinesscalc.com` (no protocol). Flips the site to production-ready: indexable, real canonical/OG URLs, `robots.txt` allows crawling. |
| `PUBLIC_GA4_MEASUREMENT_ID` | A real GA4 ID, e.g. `G-XXXXXXXXXX`. Enables the GA4 script. Leave unset to keep analytics fully disabled. |
| `PUBLIC_CONTACT_EMAIL` | A monitored inbox shown on `/contact` and `/privacy` (pricing-calculators). |
| `PUBLIC_ORGANIZATION_NAME` | Name credited in the footer, `/about`, `/privacy`, and Organization JSON-LD (pricing-calculators). |

No code changes are required to go from "no domain" to "live" — just set
these two values in the Cloudflare Pages dashboard and redeploy.

## How to add a new site

See [docs/adding-a-site.md](docs/adding-a-site.md). In short: copy
`sites/example-calculator/`, rename it, edit `site.config.ts`, and build.

## How to add a new calculator

See [docs/adding-a-calculator.md](docs/adding-a-calculator.md). In short:
add a folder under `packages/calculators/src/<name>/` with `types.ts` +
`calculate.ts` + tests, add an export entry to that package's
`package.json`, then build a page around it.

## GA4 configuration

Covered above in [Configuring a site for launch](#configuring-a-site-for-launch).
Analytics never receive user-entered values — see `packages/ui/src/analytics.ts`
and `packages/ui/src/calculator-form.ts`: tracked events are limited to
`calculator_complete` and `calculator_error`, carrying only a calculator id
and an error count.

## Deploying a site to Cloudflare Pages

See [docs/deployment.md](docs/deployment.md) for the full walkthrough
(build command, output directory, env vars, custom domain, GitHub Actions).
Nothing has been deployed and no Cloudflare/GitHub accounts or secrets are
assumed to exist yet.

## Ads

Ads are staged by config (env vars for `pricing-calculators`). A publisher
ID alone adds only the AdSense verification tag and `/ads.txt`. Enabling ads
adds the loader in `<head>` (`AdsHead.astro`). `AdSlot.astro` renders a
manual unit only when ads are enabled and a numeric slot ID is set, and it
reserves its height so loading doesn't shift content. The CSP in `_headers`
is generated from the same config (`buildSecurityHeaders()` in `@repo/seo`).
See [docs/operations-checklist.md](docs/operations-checklist.md), section 4.

## Privacy policy

`pricing-calculators` ships `/privacy` and `/terms` pages written against the
real configuration: the analytics and advertising sections switch
automatically with the config. Neither is lawyer-reviewed. The example
site's privacy page is still a template placeholder.

## Site-specific launch checklists

- [docs/launch-checklist.md](docs/launch-checklist.md) — `pricing-calculators`
- [docs/infrastructure.md](docs/infrastructure.md) — live setup record: domain, Pages project, env vars, DNS and Email Routing records, accounts
- [docs/operations-checklist.md](docs/operations-checklist.md) — Cloudflare setup, security, ads, legal, and ongoing operations
