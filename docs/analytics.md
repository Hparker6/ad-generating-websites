# Analytics event dictionary

One GA4 property per site. The measurement ID is supplied at build time by the
`PUBLIC_GA4_MEASUREMENT_ID` environment variable and validated against GA4's
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
- **No consent banner.** GA4 is off entirely right now, so there is nothing to
  consent to. Before enabling it, see the open question below.

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

These are not legal conclusions, they are the decisions a person needs to make
before analytics is switched on:

- GA4 sets cookies and processes IP-derived location. Whether a consent banner
  is required depends on the audience's jurisdiction (UK/EU PECR and GDPR, and
  several US state laws, each differ). `anonymize_ip` is set, which reduces but
  does not eliminate the question.
- The privacy policy (`/privacy`) currently describes a site that collects
  nothing. It must be updated in the same deploy that enables analytics,
  not after.
- If ads are enabled later, AdSense's own data collection is a separate and
  substantially larger consent question than GA4's.
