# Deploying to Cloudflare Pages

Nothing in this repo has been deployed, and no Cloudflare or GitHub
accounts/secrets are assumed to exist. This is what to do when you're ready.

Each site gets **its own** Cloudflare Pages project — this is a monorepo,
but it is never one runtime serving multiple domains.

## One-time setup per site (example: `pricing-calculators`)

In the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect
to Git**, pick this repository, then configure:

| Setting | Value |
|---|---|
| **Root directory** | `/` (repo root — needed so pnpm can see the workspace) |
| **Build command** | `pnpm install --frozen-lockfile && pnpm --filter site-pricing-calculators build` |
| **Build output directory** | `sites/pricing-calculators/dist` |
| **Node version** | 20 or later (set `NODE_VERSION=20` as an environment variable if Cloudflare's default is older) |

Repeat with a separate Pages project for every other site, swapping the
`--filter` target and output path.

### Environment variables (Settings → Environment variables)

| Variable | Required? | Purpose |
|---|---|---|
| `PUBLIC_SITE_DOMAIN` | No (until launch) | Bare hostname, e.g. `pricingcalcs.com`. Unset = site stays in safe "no domain yet" mode (noindex, `robots.txt` disallow). See the root README. |
| `PUBLIC_GA4_MEASUREMENT_ID` | No | A real GA4 ID, e.g. `G-XXXXXXXXXX`. Unset = analytics stay fully disabled. |
| `PUBLIC_CONTACT_EMAIL` | Recommended | A monitored inbox, e.g. `hello@pricingcalcs.com`. Shown on `/contact` and `/privacy`. Unset = those pages say an address is coming. |
| `PUBLIC_ADSENSE_CLIENT_ID` / `PUBLIC_ADS_ENABLED` / `PUBLIC_ADSENSE_SLOT_IN_CONTENT` | Later | AdSense, in stages — see [Enabling ads later](#enabling-ads-later). |
| `PUBLIC_ORGANIZATION_NAME` | No | Your name or business name. Used in the footer copyright, `/about`, `/privacy`, and Organization structured data. Unset = the site name is credited instead. |

Set these per-environment (Production vs. Preview) if you want previews to
stay non-indexed even after the production domain is live — e.g. only set
`PUBLIC_SITE_DOMAIN` on the **Production** environment, not **Preview**.

## Deploying a preview

Every push to a non-production branch (or a PR) that Cloudflare Pages is
watching automatically gets its own preview URL
(`https://<hash>.<project>.pages.dev`) — no domain required. Cloudflare sets
`CF_PAGES_URL` for that build automatically, which `resolveOrigin()` in
`@repo/seo` picks up as the canonical/OG base URL for that preview (see the
README's "Domains & canonical URLs" section) — the preview is still forced
`noindex` the whole time, since `PUBLIC_SITE_DOMAIN` isn't set.

To preview locally instead of via Cloudflare:

```bash
pnpm --filter site-pricing-calculators build
pnpm --filter site-pricing-calculators preview
```

## Connecting a custom domain later

Once you've purchased a domain:

1. Cloudflare dashboard → your Pages project → **Custom domains → Set up a
   custom domain**, follow the DNS instructions.
2. Set `PUBLIC_SITE_DOMAIN` (bare hostname, no protocol) as a Production
   environment variable on that Pages project.
3. Redeploy (or just push a commit — the next build picks up the new env
   var). The site flips from noindex/disallow to indexable automatically;
   no code changes needed.

## Adding GA4 later

Once you have a GA4 property and measurement ID:

1. Set `PUBLIC_GA4_MEASUREMENT_ID` as an environment variable on the Pages
   project (Production environment, typically).
2. Redeploy. The GA4 script is injected automatically; no code changes.

## Enabling ads later

For `pricing-calculators`, ads are controlled entirely by environment
variables (Production environment), in two stages:

| Variable | When | Effect |
|---|---|---|
| `PUBLIC_ADSENSE_CLIENT_ID` | When applying to AdSense | Adds the `google-adsense-account` verification meta tag and a real `/ads.txt`. No ads load. |
| `PUBLIC_ADS_ENABLED` | After approval: `true` | Loads AdSense (Auto ads) and relaxes the generated CSP to allow it. |
| `PUBLIC_ADSENSE_SLOT_IN_CONTENT` | Optional | A numeric ad-unit ID that fills the in-content slot on every page. |

Invalid IDs fail the build. The security headers (`dist/_headers`) are
generated from the config on every build by `buildSecurityHeaders()` in
`@repo/seo`, so the CSP always matches what's enabled. Review the consent and
policy items in [operations-checklist.md](operations-checklist.md) (section 4)
before setting `PUBLIC_ADS_ENABLED`.

## GitHub Actions: build/deploy only the changed site

`.github/workflows/deploy.yml` (in this repo) uses path filters so a commit
that only touches `sites/pricing-calculators/**` or its shared package
dependencies only builds/deploys that one site, not every site in the
monorepo. It's wired up to run `wrangler pages deploy`, but **it will not
run successfully until you add these repository secrets**:

| Secret | Where to get it |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create Token ("Cloudflare Pages — Edit" template) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar of any domain/Pages overview page |

Until those secrets exist, the deploy step is automatically **skipped**
(not failed) — the workflow prints a message and exits successfully. The
install/typecheck/test/build steps still run on every push and matter
regardless of whether secrets are configured.
