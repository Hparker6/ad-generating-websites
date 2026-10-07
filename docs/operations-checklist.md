# Operations checklist: pricing-calculators

Everything to keep in mind for running this site as an ad-supported side
project: deployment, Cloudflare, security, ads, legal/privacy, analytics, SEO,
UI, and the business side. Tags:

- **[launch]** do before or on launch day
- **[before ads]** do before applying for or enabling ads
- **[ongoing]** recurring habits

Cloudflare dashboard menu names change from time to time; if a path below
doesn't match exactly, search the dashboard for the setting name.

## Status at a glance (October 6, 2026)

**Done in code** — no action needed:

- Clean URLs with no redirects on Cloudflare Pages (`build.format: "file"`), verified in the Pages emulator.
- Security headers generated from the config at build time; the CSP opens up automatically for GA4, Cloudflare Web Analytics, and ads.
- AdSense in two stages, both driven by environment variables (section 4): verification meta tag, `/ads.txt`, head loader, real slot IDs, and format validation that fails the build on a bad ID.
- `/terms` page, linked in the footer.
- Branded social-share image, favicon, and Apple touch icon.
- Sitemap `lastmod` taken from each tool's `updated` date.
- Dependabot monthly update PRs (npm and GitHub Actions).
- GitHub Actions passes the `PUBLIC_*` variables to builds and runs on `main` and `master`.
- HSTS no longer sends `preload`, so nothing commits the domain to the preload list by accident.
- Audits: axe found zero WCAG 2.1 AA violations on all 16 pages in light and dark mode, with no CSP or script errors. Lighthouse (mobile) scores performance 99, accessibility 100, best practices 100, and SEO 100 with a domain set.

**Needs you** (accounts, dashboards, money, legal): everything in sections 1, 2 (first two items), 4 (applying and policy), 5, 6, and 9, plus items marked **[you]**.

---

## 1. Cloudflare setup, step by step

### 1.1 Pages project [launch]

Workers & Pages → Create → Pages → **Connect to Git** → pick this repo.

| Setting | Value |
|---|---|
| Production branch | `main` |
| Root directory | `/` |
| Build command | `pnpm install --frozen-lockfile && pnpm --filter site-pricing-calculators build` |
| Build output directory | `sites/pricing-calculators/dist` |
| Environment variable | `NODE_VERSION` = `20` |

**Pick one deploy path, not both.**
- **Recommended: Cloudflare Git integration** (the setup above). Leave the
  GitHub `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets unset, so the
  GitHub workflow keeps running tests and builds but skips deploying.
- Alternative: GitHub Actions direct upload. Builds then run on GitHub,
  **not** Cloudflare, so Cloudflare dashboard variables are ignored. Set the
  `PUBLIC_*` values as GitHub repository **variables** instead (Settings →
  Secrets and variables → Actions → Variables). The workflow passes them
  through; without `PUBLIC_SITE_DOMAIN` the deployed site is `noindex`.

### 1.2 Environment variables [launch]

Pages project → Settings → Variables and Secrets. Set these on **Production
only**, so preview deploys stay `noindex`:

| Variable | Value |
|---|---|
| `PUBLIC_SITE_DOMAIN` | `thebusinesscalc.com` (no `https://`, no `www`) |
| `PUBLIC_CONTACT_EMAIL` | `hello@thebusinesscalc.com` (see Email Routing below) |
| `PUBLIC_ORGANIZATION_NAME` | Optional: your name or business name |
| `PUBLIC_GA4_MEASUREMENT_ID` | Optional: `G-XXXXXXXXXX` (read section 6 first) |
| `PUBLIC_ADSENSE_CLIENT_ID` | Later: `ca-pub-…` when you apply to AdSense (section 4) |
| `PUBLIC_ADS_ENABLED` | Later: `true` once AdSense approves the site |
| `PUBLIC_ADSENSE_SLOT_IN_CONTENT` | Later, optional: numeric ad-unit ID |

Variables are read **at build time**: after changing one, trigger a new
deployment (Deployments → ⋯ → Retry deployment, or push a commit).

### 1.3 Domain and DNS [launch]

- Buy the domain (Cloudflare Registrar sells at cost). Turn on **auto-renew**
  and keep the registrar lock on. WHOIS privacy is automatic at Cloudflare.
- Pages project → Custom domains → add **both** `thebusinesscalc.com` and
  `www.thebusinesscalc.com`.
- Redirect `www` → apex: Rules → **Redirect Rules** → create a rule:
  hostname equals `www.thebusinesscalc.com` → dynamic redirect to
  `concat("https://thebusinesscalc.com", http.request.uri.path)`, status **301**,
  preserve query string.
- DNS → Settings → enable **DNSSEC**.
- Optional: a **CAA** record allowing only the CA Cloudflare uses, so no
  one else can issue a certificate for your domain.

### 1.4 SSL/TLS [launch]

- SSL/TLS → Edge Certificates: **Always Use HTTPS** on, **Minimum TLS
  version** 1.2, **Automatic HTTPS Rewrites** on.
- HSTS is already sent by the generated `_headers` (`max-age=31536000;
  includeSubDomains`). `preload` is deliberately left off: only add it, and
  submit to hstspreload.org, once you're sure every current and future
  subdomain will be HTTPS-only, because preload is very hard to undo. Leave
  Cloudflare's own HSTS toggle off so the header isn't sent twice.

### 1.5 Bots and AI crawlers [launch]

This site's growth plan depends on search engines **and** AI assistants
reading it.

- Security → Bots: **Block AI bots / AI Scrapers and Crawlers → off**.
- **AI Labyrinth → off** (it feeds decoy pages to crawlers).
- **Managed robots.txt → off**, so the site's own `/robots.txt` is served
  unchanged.
- **Bot Fight Mode → off** to start. Verified bots like Googlebot are
  normally exempt, but it can challenge ad-verification and smaller
  crawlers. Turn it on only if you see abusive traffic.
- Caching → Configuration → **Crawler Hints → on**. Cloudflare then pings
  IndexNow (Bing, Yandex) when pages change, which feeds Bing / ChatGPT search.

### 1.6 Email Routing for the contact address [launch]

- Email → **Email Routing** → enable → create `hello@thebusinesscalc.com` →
  forward to your personal inbox. It's free, and Cloudflare adds the MX/SPF
  records.
- Add a DMARC record, e.g. TXT `_dmarc` = `v=DMARC1; p=quarantine;
  rua=mailto:hello@thebusinesscalc.com`, so others can't spoof your domain.
- Set `PUBLIC_CONTACT_EMAIL` to that address and redeploy.

### 1.7 Analytics options [launch, optional]

- **Cloudflare Web Analytics** is free and cookieless, so it needs no consent
  banner — a good first analytics tool. Turn it on under the Pages project →
  Metrics → Web Analytics. The CSP already allows its script and beacon, so
  no code change is needed.
- GA4: see section 6.

### 1.8 Account safety [launch]

- Turn on two-factor authentication for Cloudflare, your registrar, GitHub,
  and the Google account that will own AdSense, GA4, and Search Console.
- If you create a Cloudflare API token, scope it to **Account → Cloudflare
  Pages → Edit** only.
- Notifications → add an alert for **Pages deployment failure**.
- If you ever delete a Pages project or site, delete its DNS records too, so
  nobody can take over the dangling subdomain.

---

## 2. Deployment and release

- **Repo (done):** pushed to `github.com/Hparker6/ad-generating-websites`, branch `main`. **[you]** Make sure the GitHub repo is **private** unless you intend it to be public.
- **Branch:** `main` is the production branch; set the same in Cloudflare.
- **[launch] Smoke-test right after the first production deploy:**
  - `/robots.txt` shows `Allow: /` and the sitemap URL on your domain.
  - `/llms.txt` lists your domain's URLs.
  - `/break-even` returns 200 with no redirect; `/break-even/` redirects to it.
  - View source on one page: `<meta name="robots" content="index, follow">`,
    and the canonical is `https://thebusinesscalc.com/...`.
  - `www.thebusinesscalc.com` 301-redirects to the apex.
  - `https://<project>.pages.dev` still works; its canonical points at your
    domain, so it won't compete in search.
- **[ongoing] Rollback:** Pages → Deployments → choose a previous good
  deployment → **Rollback**. It's instant, with no rebuild.
- **[ongoing] Use preview deploys:** every non-production branch gets a
  `noindex` preview URL. Check changes there before merging.
- **[ongoing] Run locally before pushing:** `pnpm run test`,
  `pnpm run typecheck`, `pnpm --filter site-pricing-calculators build`.

**URL format (done):** Astro outputs `break-even.html` (`build.format:
"file"` in `astro.config.mjs`) because Cloudflare Pages 308-redirects
directory-index pages (`/break-even` → `/break-even/`). Keep that setting.
Removing it would put every canonical URL behind a redirect.

---

## 3. Security

What's already in place: strict CSP, HSTS, `X-Frame-Options: DENY`, no forms
(`form-action 'none'`), no cookies or third-party scripts while analytics and
ads are off, URL query prefill that accepts only plain numbers, and
calculator inputs validated with zod.

- **CSP is generated (done).** `buildSecurityHeaders()` in
  `packages/seo/src/headers.ts` writes `_headers` on every build. With
  everything off, only Cloudflare Web Analytics is allowed. A GA4 ID adds the
  Google Analytics hosts. `PUBLIC_ADS_ENABLED=true` opens `script-src`,
  `frame-src`, `img-src`, and `connect-src` to `https:` (plus
  `'unsafe-eval'`, per Google's ad-tag CSP guidance) and relaxes COOP to
  `same-origin-allow-popups` so ad clicks work. AdSense loads from a long,
  changing list of Google hosts, so a per-host allowlist would break without
  warning. Unit tests cover each state.
- **[you, when ads go live]** Load a few pages with ads, open DevTools →
  Console, and confirm there are no "Refused to load" errors. Check the
  consent dialog in an EU-located browser or VPN. Never click a live ad.
- **[ongoing] Dependencies:** Dependabot (`.github/dependabot.yml`) opens
  grouped update PRs monthly, and CI builds and tests each one. **[you]** Merge
  them when green, and run `pnpm audit` occasionally. The attack surface is the build chain
  (Astro, Vite, zod); nothing runs server-side.
- **[ongoing] Third-party scripts:** keep the list to what earns its place
  (GA4 or Cloudflare Analytics, AdSense, the consent manager). Every script
  can read the page.
- **[ongoing] Secrets:** `.env` is gitignored. Never commit API tokens.
  `PUBLIC_*` values end up in the page, so never put a secret in one.
- **Future embed widget:** `X-Frame-Options: DENY` and `frame-ancestors
  'none'` block all framing. An `/embed/*` route would need its own header
  block in `_headers` that allows framing for those paths only.
- **Contact email spam:** a published address will get spam. Cloudflare
  Email Routing forwards it to your inbox, which has your normal filtering.

---

## 4. Ads (AdSense first)

### How ads are switched on (code done; steps are yours)

Everything is controlled by Cloudflare Pages environment variables — no code
changes, just set them and redeploy.

| Stage | Set these | What ships |
|---|---|---|
| 0. Today | nothing | No ad code at all; `/ads.txt` is a comment-only file; strict CSP. |
| 1. Apply | `PUBLIC_ADSENSE_CLIENT_ID=ca-pub-…` | `<meta name="google-adsense-account">` on every page and a real `/ads.txt`. Still no ads, no cookies, and the CSP stays strict. |
| 2. Approved | add `PUBLIC_ADS_ENABLED=true` | The AdSense loader in `<head>` (Auto ads work), relaxed CSP and COOP, and the privacy page's Advertising section switches over. |
| 2b. Manual unit (optional) | add `PUBLIC_ADSENSE_SLOT_IN_CONTENT=1234567890` | That ad unit fills the in-content slot on every page (after the formula, before the FAQ). |

A malformed publisher or slot ID fails the build with a clear message, rather
than shipping broken markup.

### Before applying [before ads]

- **[you]** The site is live on your domain and `PUBLIC_CONTACT_EMAIL` is set.
  `/privacy` and `/terms` are reachable from every page (both are in the
  footer — done).
- **[you]** In AdSense, add the site, choose "Meta tag" verification, set
  `PUBLIC_ADSENSE_CLIENT_ID`, redeploy, then click Verify. Check that
  `https://thebusinesscalc.com/ads.txt` shows your `pub-` line.
- Expect review to take days to weeks. A first rejection for "low-value
  content" is common on new sites: add pages and reapply.

### Consent and privacy law [before ads]

- **EEA/UK/Switzerland:** Google requires a certified consent management
  platform (CMP) that supports TCF and Consent Mode v2. AdSense's own
  **Privacy & messaging → European regulations** message is free and
  certified.
- **US states (California etc.):** enable the AdSense **US state
  regulations** message ("Do not sell or share my personal information")
  and restricted data processing for opted-out users.
- **Children:** the site isn't child-directed. Don't tag it as such, and
  don't add content aimed at children.
- The `/privacy` Advertising section switches automatically when
  `ads.enabled` is true. Re-read it once ads are live.

### AdSense policy traps that get accounts banned [ongoing]

- **Never click your own ads**, and don't ask friends to. Use AdSense's
  preview or a browser where you're signed in as the publisher.
- Never ask visitors to click ads or label them misleadingly. "Advertisement"
  or "Sponsored" labels are fine.
- **Don't place ads where they'll be clicked by accident** — especially
  next to the +/− steppers, presets, or "Copy link" on mobile. Keep ads out
  of the calculator panel. The existing placement (after the formula, before
  the FAQ) is a good default.
- **Don't buy traffic** (cheap "visitors" packages, traffic exchanges, bot
  traffic). Invalid traffic is the most common reason accounts get closed.
- If using **Auto ads**, exclude the calculator area and review placements in
  AdSense's page preview. Auto ads will happily drop a unit between an input
  and its result.

### Revenue and user experience [ongoing]

- Start with 1–2 units per page. Ad density hurts Core Web Vitals and can
  hurt rankings, which costs more than the extra unit earns.
- Keep the reserved-height approach in `AdSlot.astro`, so ads never push
  content down (layout shift).
- Lazy-load ads below the fold (AdSense does this for responsive units).
- In AdSense → **Blocking controls**, consider blocking categories that would
  undercut trust on a finance-adjacent site (get-rich-quick, payday loans).
- Expect ad blockers to hide a meaningful share of impressions among
  business and tech audiences.
- Later options with higher payouts: Ezoic (no traffic minimum), then
  Mediavine/Raptive once traffic meets their thresholds.
- **Affiliate links** (accounting software, Shopify, invoicing tools) may earn
  more than display ads here. Mark them `rel="sponsored noopener"`, disclose
  them near the link (FTC rules), and say so on the privacy page.

---

## 5. Legal and privacy

- **[launch]** The privacy policy describes the site's real behavior, but it
  isn't lawyer-reviewed. Have it reviewed once revenue makes that worthwhile.
- **Terms of use (done):** `/terms` covers as-is provision, estimates rather
  than advice, limitation of liability, and acceptable use, and is linked in
  the footer. Like the privacy policy, it isn't lawyer-reviewed. **[you]**
  Get both reviewed once revenue justifies it, and bump `lastUpdated` in
  `terms.astro` / `privacy.astro` whenever either changes.
- **[launch]** Keep the "not financial advice" framing. It's already in the
  footer, About, and the freelance page's tax note.
- **[before GA4]** If you have EU/UK visitors, GA4 cookies need consent there
  — use the same CMP as ads (section 4).
- **[ongoing]** Update `/privacy` **before** turning anything new on
  (analytics, ads, affiliate links, newsletter), and bump its "Last
  updated" date (the `lastUpdated` constant in `privacy.astro`).
- **Trademark:** before investing in a brand name or logo, run a quick search
  (USPTO TESS or your country's register) to make sure the name isn't taken
  in your category.

---

## 6. Analytics and measurement

- **[launch] Google Search Console:** add the domain property (verify by DNS
  — Cloudflare can add the record automatically) and submit
  `https://thebusinesscalc.com/sitemap-index.xml`.
- **[launch] Bing Webmaster Tools:** import from Search Console and submit the
  same sitemap. Bing feeds ChatGPT search and Copilot.
- **[launch, choose one] Analytics:**
  - **Cloudflare Web Analytics:** cookieless, no consent needed, basic but
    enough to start. Remember the CSP edit in section 1.7.
  - **GA4:** richer, and the event dictionary is already wired up
    (`docs/analytics.md`). In GA4 Admin: set data retention, turn **Google
    signals off** unless you need it, and don't link Google Ads without
    consent in place. GA4 only receives the page path and `utm_*`/`gclid`,
    never calculator inputs (enforced in `Analytics.astro`).
- **[ongoing] Weekly 15-minute review:**
  - Search Console: impressions and clicks per page; queries ranking 8–20
    (a content tweak can move them up).
  - Analytics: completion rate per calculator (`calculator_complete` ÷
    sessions).
  - Once ads are on: RPM per page in AdSense.
- **[ongoing]** Use Search Console queries to choose the next tools. Build
  pages for queries you already get impressions on.

---

## 7. SEO and content

- **[launch]** Done: keyword titles, formula-first ledes, visible formulas,
  FAQs, breadcrumbs, `dateModified`, `llms.txt`, internal links, and clean
  URLs with no redirects.
- **Share image and icons (done):** a branded 1200×630 `og-default.png`, a
  favicon, and `apple-touch-icon.png`, rendered in the site's own fonts and
  colors. Swap in a designed logo whenever you have one.
- **[ongoing]** Only change a tool's `updated` date in `src/tools.ts` when its
  content actually changes. Faking freshness is a spam signal.
- **[ongoing]** No thin programmatic pages (e.g. one page per number). Each new
  page should answer a distinct question with its own content.
- **[ongoing] Backlinks:** answer real questions in r/smallbusiness, r/Etsy,
  r/freelance, r/restaurateur and similar communities, using "Copy link" to
  share a worked result. Never buy links.
- **Later:** an author/About section with a real name and background, once
  you're comfortable, helps trust on a finance-adjacent site. A newsletter
  or "new tools" list is another option.
- **Sitemap `lastmod` (done):** each tool page reports its `updated` date from
  `src/tools.ts`; other pages omit `lastmod` instead of faking one.
- **Later:** per-page OG images.

---

## 8. UI, accessibility, and performance

- **[launch]** Test on a real iPhone (Safari) and Android (Chrome): number
  keyboards, steppers, the Copy-link button (clipboard needs a tap), and dark
  mode.
- **Audits (done, October 6, 2026):** Lighthouse mobile scored performance
  99, accessibility 100, best practices 100, and SEO 100 with a domain set.
  axe found zero WCAG 2.1 AA violations on every page, in light and dark mode.
  **[you]** Re-run Lighthouse after ads go live to see what they cost.
- **[ongoing] Accessibility:** results are announced to screen readers via
  `aria-live`, inputs have labels, and there's a skip link. Keep this up for
  new pages: label every input, and never convey meaning by color alone
  (the red/green figures have text too).
- **[before ads]** On mobile, the calculator and its answer should stay
  above the first ad. Don't let an ad land between the inputs and the result.
- **Known limitation:** currency is US dollars only (`$` and `en-US`
  formatting). Fine for now. If Search Console shows big UK/EU/AU audiences,
  consider a currency-neutral display.
- **[ongoing]** Keep the no-framework approach. The pages ship tiny JS, which
  is a ranking and ad-viewability advantage.

---

## 9. Business side

- **[launch]** Register the domain in your own name/account, not a client's
  or employer's. Keep the project separate from day-job accounts and email.
- **[before ads]** AdSense requires: tax information (W-9 in the US),
  a payment method, and **address verification by PIN**, mailed when you
  first reach $10. Payout happens once your balance passes the threshold
  ($100 in the US).
- **[before ads]** Ad income is taxable. Keep a simple spreadsheet of revenue
  and costs (domain renewal, any tools). Talk to an accountant about sole
  proprietorship vs. LLC once income is meaningful. Your day job may also
  have outside-work or moonlighting rules worth checking.
- **[ongoing] Costs today:** the domain (around $10–15/year). Cloudflare
  Pages, Email Routing, Web Analytics, and DNS are free at this scale.
- **[ongoing] Expectations:** new domains usually take months to rank.
  Judge progress by Search Console impressions trending up, not early
  revenue.

---

## 10. Quick reference: where things live

| What | Where |
|---|---|
| Domain, GA4, contact, name | Cloudflare Pages env vars (section 1.2) |
| Tool list (nav, footer, homepage, llms.txt) | `sites/pricing-calculators/src/tools.ts` |
| Ads on/off, AdSense IDs | Cloudflare Pages env vars (section 4); wiring in `site.config.ts` |
| Security headers / CSP / caching | `packages/seo/src/headers.ts` (generated into `dist/_headers` on build) |
| Terms of use | `sites/pricing-calculators/src/pages/terms.astro` |
| Privacy policy | `sites/pricing-calculators/src/pages/privacy.astro` |
| Analytics events | `docs/analytics.md`, `packages/ui/src/analytics.ts` |
| Calculator math and tests | `packages/calculators/` |
| Launch steps | `docs/launch-checklist.md` |
