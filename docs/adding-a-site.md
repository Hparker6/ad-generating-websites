# Adding a new site

Each site under `sites/` is a standalone Astro project. The fastest way to
start one is to copy an existing site and adjust it.

## 1. Copy a template

Use `sites/example-calculator/` for a single-calculator site, or
`sites/pricing-calculators/` as an example of a multi-page/multi-calculator
site with a homepage, About/Contact/Privacy pages, and internal linking.

```bash
cp -r sites/example-calculator sites/my-new-site
```

Remove `sites/my-new-site/dist` and `sites/my-new-site/node_modules` if they
got copied (they shouldn't — both are gitignored).

## 2. Rename the package

Edit `sites/my-new-site/package.json`:

```json
{
  "name": "site-my-new-site"
}
```

## 3. Write `site.config.ts`

This is the one file that defines the site's identity. At minimum:

```ts
import { GA4_PLACEHOLDER_ID, validateSiteConfig } from "@repo/seo";

const envDomain = process.env.PUBLIC_SITE_DOMAIN?.trim();
const envGa4Id = process.env.PUBLIC_GA4_MEASUREMENT_ID?.trim();

export const siteConfig = validateSiteConfig({
  siteId: "my-new-site",              // kebab-case, matches the folder name
  siteName: "My New Site",
  domain: envDomain ? envDomain : null, // null until you've bought a domain
  organizationName: "Your Company Name",
  defaultDescription: "...",
  defaultOgImage: "/og-default.png",
  locale: "en-US",
  themeColor: "#1d4ed8",
  contactEmail: "placeholder@example.com",
  analytics: { ga4MeasurementId: envGa4Id ? envGa4Id : GA4_PLACEHOLDER_ID },
  ads: { enabled: false, provider: "adsense", clientId: undefined },
  social: { twitter: undefined },
});
```

`validateSiteConfig()` throws a readable error listing every missing/invalid
field — if you forget something, `pnpm --filter site-my-new-site dev` (or
`pnpm run validate`) will tell you exactly what, before any page renders.

See [README.md § Domains & canonical URLs](../README.md#domains--canonical-urls-handling-no-domain-yet)
for what `domain: null` does, and
[README.md § Configuring a site for launch](../README.md#configuring-a-site-for-launch)
for the two environment variables that let you set a real domain/GA4 ID
later without touching code.

## 4. Generate placeholder images

Every site needs a real (not fake-extension) OG image and favicon:

```bash
node scripts/generate-placeholder-image.mjs sites/my-new-site/public/og-default.png 1200 630 "#1d4ed8"
node scripts/generate-placeholder-image.mjs sites/my-new-site/public/favicon.png 64 64 "#1d4ed8"
```

Replace these with real branded artwork before launch.

## 5. Write pages

Each page follows the same shape:

```astro
---
import { buildMeta } from "@repo/seo";
import Layout from "@repo/ui/components/Layout.astro";
import { siteConfig } from "../../site.config";

const meta = buildMeta(siteConfig, {
  title: "Page Title",
  description: "...",
  path: "/page-path",
});
---
<Layout config={siteConfig} meta={meta}>
  <h1>...</h1>
</Layout>
```

For a calculator page, see any page under `sites/pricing-calculators/src/pages/`
for the full pattern: form + results + `AdSlot` + explanation + worked
example + `FaqList` + `RelatedTools`, wired up with `wireCalculatorForm`
from `@repo/ui`.

## 6. Update `pnpm-workspace.yaml` / install

Nothing to change there — it already globs `sites/*`. Just run:

```bash
pnpm install
pnpm --filter site-my-new-site dev
```

## 7. Verify

```bash
pnpm run validate                              # config is valid
pnpm --filter site-my-new-site build            # production build succeeds
pnpm --filter site-my-new-site typecheck         # no type errors
```

## 8. Deploy

See [docs/deployment.md](deployment.md) — create a new Cloudflare Pages
project pointed at this site's folder.
