# Infrastructure record: The Business Calc

Where everything lives for the live site, so nothing has to be rediscovered.
Update this file whenever a setting changes. No secrets belong here — API
tokens and passwords stay in Cloudflare/GitHub/your password manager.

Last updated: October 6, 2026

## At a glance

| Thing | Value |
|---|---|
| Site name | The Business Calc |
| Domain | `thebusinesscalc.com` (apex is canonical; `www` should 301 to it) |
| Code | `github.com/Hparker6/ad-generating-websites`, branch `main` |
| Site folder | `sites/pricing-calculators` |
| Hosting | Cloudflare Pages (Git integration) — see below |
| Contact email | `hello@thebusinesscalc.com` (Cloudflare Email Routing → personal inbox) |
| Analytics | GA4 `G-8FRTXVHB0G` (production builds only; set in `site.config.ts`) |
| Ads | Not yet — AdSense staged via env vars (operations checklist, section 4) |

## Cloudflare Pages project

Created via Workers & Pages → Create → **Pages** → Import an existing Git
repository (not the Workers flow — it lacks per-environment variables and
needs a Wrangler config this repo doesn't have).

| Setting | Value |
|---|---|
| Project name | `thebusinesscalc` (suggested; record the actual name here) |
| Production branch | `main` |
| Framework preset | None |
| Build command | `pnpm install --frozen-lockfile && pnpm --filter site-pricing-calculators build` |
| Build output directory | `sites/pricing-calculators/dist` |
| Root directory | `/` (blank) |
| Custom domains | `thebusinesscalc.com`, `www.thebusinesscalc.com` |

### Environment variables

Set on **Production only**, so preview deploys stay `noindex` and out of GA4.

| Variable | Value | Status |
|---|---|---|
| `NODE_VERSION` | `20` | set at project creation |
| `PUBLIC_SITE_DOMAIN` | `thebusinesscalc.com` | set at project creation |
| `PUBLIC_CONTACT_EMAIL` | `hello@thebusinesscalc.com` | add once Email Routing forwarding is verified, then redeploy |
| `PUBLIC_ORGANIZATION_NAME` | — | optional; not set |
| `PUBLIC_GA4_MEASUREMENT_ID` | — | don't set; only overrides the ID in `site.config.ts` |
| `PUBLIC_ADSENSE_CLIENT_ID` | — | later: when applying to AdSense |
| `PUBLIC_ADS_ENABLED` | — | later: `true` after approval |
| `PUBLIC_ADSENSE_SLOT_IN_CONTENT` | — | later, optional |

## DNS records (thebusinesscalc.com, Cloudflare DNS)

### Email Routing (added by Cloudflare when Email Routing is activated)

| Type | Name | Value | Priority |
|---|---|---|---|
| MX | `thebusinesscalc.com` | `route1.mx.cloudflare.net` | 40 |
| MX | `thebusinesscalc.com` | `route2.mx.cloudflare.net` | 84 |
| MX | `thebusinesscalc.com` | `route3.mx.cloudflare.net` | 21 |
| TXT (DKIM) | `cf2024-1._domainkey.thebusinesscalc.com` | `v=DKIM1; h=sha256; k=rsa; p=…` (public key, managed by Cloudflare — view the full value in DNS → Records) | — |
| TXT (SPF) | `thebusinesscalc.com` | `v=spf1 include:_spf.mx.cloudflare.net ~all` | — |

These are managed by Email Routing: don't edit or delete them by hand, or
forwarding stops. If they're ever removed, Email Routing → Settings offers to
re-add them.

### Added manually (recommended)

| Type | Name | Value | Status |
|---|---|---|---|
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:hello@thebusinesscalc.com` | to add |

### Added by Pages custom domains

Cloudflare creates the apex and `www` records automatically when the custom
domains are attached in the Pages project. Don't point them anywhere else.

## Email Routing

| Address | Forwards to | Notes |
|---|---|---|
| `hello@thebusinesscalc.com` | owner's personal inbox (verified in Cloudflare) | Public contact for the site, privacy requests, and AdSense |

- Replies go out from the personal inbox. To reply *as* `hello@`, set up a
  "send mail as" alias in the personal mail client, or move to a paid mailbox.
- To change the destination: Email → Email Routing → Routing rules. No site
  change is needed.

## Accounts checklist

Each of these should have two-factor authentication on, and should be owned
by the site owner's own accounts, not an employer's.

| Service | Used for |
|---|---|
| Cloudflare | DNS, Pages hosting, Email Routing, domain (if registered there) |
| Domain registrar | `thebusinesscalc.com` registration — auto-renew on |
| GitHub (`Hparker6`) | Source code, CI, Dependabot |
| Google (GA4) | Analytics property `G-8FRTXVHB0G` |
| Google Search Console / Bing Webmaster Tools | Search indexing — to set up after launch |
| Google AdSense | Later |

## Related docs

- [operations-checklist.md](operations-checklist.md) — every setting, click by click
- [launch-checklist.md](launch-checklist.md) — launch-day steps
- [deployment.md](deployment.md) — build and environment variable reference
- [analytics.md](analytics.md) — GA4 events and consent behavior
