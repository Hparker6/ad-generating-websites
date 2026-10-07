# Launch checklist: pricing-calculators

What's already handled, and what's left to do around the cold launch of
`sites/pricing-calculators`. For the full list — Cloudflare settings click by click,
security, ads policy, legal, and business — see
[operations-checklist.md](operations-checklist.md).

## Already handled

- [x] 10 tools, each with pure, tested logic where there's a calculation:
      break-even, target profit, contribution margin, markup vs. margin,
      selling price, markup ↔ margin conversion chart, discount profit,
      price increase, food cost / menu price, freelance hourly rate.
- [x] Every tool registered once in `src/tools.ts`, which drives the header,
      footer, homepage, breadcrumbs, structured data, and `/llms.txt`.
- [x] Per page: keyword-first `<title>`, the definition and formula in the
      lede, keyword headings, the formula and worked example visible (not
      collapsed), visible FAQs, related-tool links, and a visible "Updated" date.
- [x] Structured data: `WebApplication` (with `dateModified`) and
      `BreadcrumbList` on every tool page. No `FAQPage` — Google limited FAQ
      rich results to government/health sites in 2023.
- [x] `/llms.txt` for AI assistants, listing each tool's formula and its URL
      query parameters.
- [x] Calculator links can carry inputs (`/markup-vs-margin?unitCost=60&sellingPrice=100`),
      and every calculator has a "Copy link to this result" button. The
      address bar is never rewritten while typing, and the GA4 page location
      drops every query parameter except `utm_*`/`gclid`, so typed figures
      never reach analytics.
- [x] Privacy policy written against the real configuration (analytics and
      ads sections switch automatically with the config).
- [x] No "preview" / "unnamed business" banners; without a business name the
      site name is credited.
- [x] Sitewide `noindex` + `robots.txt: Disallow: /` until a domain is set.
- [x] Clean URLs served with no redirects on Cloudflare Pages.
- [x] `/terms`, a branded share image and icons, sitemap `lastmod`, generated
      security headers, AdSense staging via env vars, and Dependabot.
- [x] Audited: zero axe WCAG 2.1 AA violations; Lighthouse 99–100 in every
      category (SEO 100 with a domain set).

## Launch day

1. **Buy the domain**, connect it in Cloudflare Pages, and set
   `PUBLIC_SITE_DOMAIN` on the **Production** environment. This flips the site
   to indexable. See [deployment.md](deployment.md).
2. **Set `PUBLIC_CONTACT_EMAIL`** to a monitored inbox (a free forwarding
   address on the new domain is fine). Until it's set, `/contact` says an
   address is coming — fine for a day or two, but don't apply for ads without it.
3. Optionally set **`PUBLIC_ORGANIZATION_NAME`** (your name or business name).
4. **Cloudflare → Security → Bots: make sure AI crawlers are not blocked.**
   Cloudflare can block GPTBot, ClaudeBot, PerplexityBot, etc. by default,
   which would hide the site from AI search.
5. **Google Search Console and Bing Webmaster Tools:** verify the domain and
   submit `https://<domain>/sitemap-index.xml` to both. Bing's index feeds
   ChatGPT search and Copilot.
6. **GA4 (recommended):** create a property and set
   `PUBLIC_GA4_MEASUREMENT_ID`. If you get meaningful traffic from the EU/UK,
   GA4 cookies need consent there — add a consent banner before or alongside
   ads (step 9 covers this).
7. Redeploy, then spot-check `/robots.txt` (should say `Allow: /`), `/llms.txt`,
   and one page's `<link rel="canonical">`.

## After launch

8. **Swap in a designed logo** whenever you have one. The current OG image,
   favicon, and Apple touch icon are typographic but real, not placeholders.
9. **Ads.** Code is ready — it's all environment variables now:
   - apply: set `PUBLIC_ADSENSE_CLIENT_ID` (verification tag and `/ads.txt`);
   - set up a Google-certified consent banner (AdSense → Privacy & messaging)
     for EEA/UK/Swiss visitors, and the US-states message;
   - approved: set `PUBLIC_ADS_ENABLED=true`. The CSP, COOP, and privacy page
     switch over automatically.
   See [operations-checklist.md](operations-checklist.md), section 4.
10. **Distribution:** answer real questions in small-business, Etsy, freelance
    and restaurant communities with a link to the specific tool (the copy-link
    button lets you link to a worked example).
11. Next candidates for new tools: Etsy/Shopify fee-aware pricing, wholesale vs.
    retail price, gross profit, and an embeddable widget route (`/embed/*`
    with relaxed `frame-ancestors`) for backlinks.
