# Analytics event dictionary

One GA4 property per site. For `pricing-calculators` the ID (`G-8FRTXVHB0G`)
is the production default in `site.config.ts`, used only when
`PUBLIC_SITE_DOMAIN` is set; `PUBLIC_GA4_MEASUREMENT_ID` overrides it. The ID is validated against GA4's
own format (`G-` plus 4–20 uppercase alphanumerics) in
`packages/seo/src/site-config.ts`. While it is left at `G-PLACEHOLDER`,
`isAnalyticsEnabled()` returns false, no gtag script is emitted, and the site
makes no third-party requests at all.

## The rule that shapes this file

**No figure a visitor types is ever sent anywhere.** That is enforced
structurally, not by convention: `AnalyticsEventParams` in
`packages/ui/src/analytics.ts` types every event's payload, and `trackEvent` is
generic over that map, so passing a cost, price, margin or result is a
TypeScript error rather than a code-review question.

Verified by the Playwright suite: with a value typed into a field, the page
issues zero outbound requests (`sec-audit.mjs`, section 4).

## Events

| Event | Fires when | Parameters | Notes |
|---|---|---|---|
| `page_view` | GA4 automatic | — | Emitted once per page by the `gtag("config", …)` call. The site is static multi-page with no client router, so there is no second, manual pageview and no duplicate risk. |
| `calculator_complete` | Inputs validate, 400 ms after the last keystroke | `calculator_id` | Debounced, so holding a key down produces one event, not one per character. Only fires after a real user interaction — the server-rendered default never counts. |
| `calculator_error` | Inputs fail validation, same debounce | `calculator_id`, `error_count` | A count, never the messages or the offending values. |
| `preset_select` | A worked-example button is applied | `calculator_id`, `preset_index` | Position only. The values the preset sets are deliberately not sent. |
| `next_step_click` | The "Next step" cross-link is clicked | `calculator_id`, `destination` | Measures the intended journey (contribution margin → break-even → target profit). `destination` is an internal path. |

`calculator_id` is one of: `break-even`, `target-profit`, `contribution-margin`,
`markup-margin`, `selling-price`, `discount`, `price-increase`, `food-cost`,
`freelance-rate`.

## Deliberate omissions

- **No keystroke-level events.** The debounce exists so the funnel measures
  intent, not typing.
- **No outbound-link tracking.** The site links out to nothing today. Add a
  handler only if that changes.
- **No scroll depth, no engagement pings beyond GA4's defaults.** They would not
  change a decision about a calculator.
- **No consent banner yet — Consent Mode v2 instead.** `Analytics.astro` sets
  consent to *denied* by default for the EEA, UK and Switzerland (cookieless
  pings, which Google models) and *granted* elsewhere. When a consent banner is
  added (AdSense Privacy & messaging, required before ads), it updates consent
  through `gtag("consent", "update", …)` and EU/UK visitors who accept are then
  measured with cookies.

## Measuring whether the site works

Two sources, joined on page path:

**Google Search Console** (needs a verified domain — not possible until
`PUBLIC_SITE_DOMAIN` is set and the site is actually indexable): impressions,
clicks, CTR, average position, per page and per query.

**GA4**: sessions, `calculator_complete` count, and engagement, per page.

The ratio worth watching per calculator is:

```
completion rate = calculator_complete events ÷ sessions on that page
```

A page earning impressions but with a low completion rate is usually a
mismatch between the query and what the tool actually answers — a content
problem, not a traffic problem. A page with a high completion rate and few
impressions is a visibility problem. The two numbers separate those cases,
which is the whole reason to collect them.

Add revenue per page only once monetisation exists; until then it is zero for
every page and tells you nothing.

## Open questions for human/legal review

These are not legal conclusions; they're decisions for a person to confirm:

- GA4 is live in production (`G-8FRTXVHB0G`, set in `site.config.ts`; preview
  and local builds don't report). EEA/UK/CH visitors get no analytics cookies
  until a consent banner exists. Whether US state laws call for an opt-out
  link for analytics alone is worth a check; the AdSense US-states message
  covers it once ads start.
- The privacy policy (`/privacy`) switches to its analytics wording
  automatically whenever a GA4 ID is configured, including the consent
  behavior above.
- If ads are enabled later, AdSense's own data collection is a separate and
  substantially larger consent question than GA4's.
