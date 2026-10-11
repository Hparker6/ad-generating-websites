# Analytics event dictionary

One GA4 property per site. For `pricing-calculators` the ID (`G-8FRTXVHB0G`)
is the production default in `site.config.ts`, used only when
`PUBLIC_SITE_DOMAIN` is set; `PUBLIC_GA4_MEASUREMENT_ID` overrides it. The ID is
validated against GA4's own format (`G-` plus 4–20 uppercase alphanumerics) in
`packages/seo/src/site-config.ts`. While it is left at `G-PLACEHOLDER`,
`isAnalyticsEnabled()` returns false, no gtag script is emitted, and the site
makes no third-party requests at all.

## The rule that shapes this file

**No figure a visitor types is ever sent anywhere.** That is enforced
structurally, not by convention: `AnalyticsEventParams` in
`packages/ui/src/analytics.ts` types every event's payload (ids, counts,
positions, internal paths), and `trackEvent` is generic over that map, so
passing a cost, price, margin or result is a TypeScript error rather than a
code-review question. The page location sent with every event has its query
string stripped (except `utm_*`/`gclid`), because calculator links can carry
inputs in the URL.

## Events

`calculator_id` is always the tool's URL slug — it's set on each form from the
tool registry (`src/tools.ts`), so it can't drift from the URL: `break-even`,
`target-profit`, `contribution-margin`, `markup-vs-margin`, `selling-price`,
`discount-calculator`, `price-increase-calculator`, `food-cost-calculator`,
`freelance-hourly-rate`. Link events on the static chart page use
`markup-margin-chart`.

| Event | Fires when | Parameters | Count per page view |
|---|---|---|---|
| `page_view` | GA4 automatic, from `gtag("config")` | — | 1 |
| `calculator_complete` | The **first** valid result after a user interaction (typing, stepper, slider, or preset), 400 ms after the last change | `calculator_id` | 0 or 1 |
| `calculator_adjust` | Each **later** valid result in the same page view, same 400 ms pause | `calculator_id`, `adjustment_count` (1, 2, 3…) | 0 or more |
| `calculator_error` | The inputs become invalid after an interaction. Not repeated while they stay invalid; fires again only after a valid result in between | `calculator_id`, `error_count` (how many messages) | 0 or more |
| `prefilled_result_view` | The page opened from a link carrying inputs, and those inputs produced a valid result with no editing | `calculator_id`, `prefilled_field_count` | 0 or 1 |
| `preset_select` | A worked-example button is applied | `calculator_id`, `preset_index` (0-based position) | 0 or more |
| `copy_link` | "Copy link to this result" copied successfully | `calculator_id` | 0 or more |
| `next_step_click` | The "Next step" link at the foot of a tool page | `calculator_id`, `destination` (internal path) | 0 or more |
| `related_tool_click` | A card in "Related calculators" | `calculator_id`, `destination` (internal path) | 0 or more |

Rules that keep the numbers meaningful:

- **A page load is never a completion**, not even with prefilled inputs —
  that's `prefilled_result_view`, a separate signal.
- **A preset click counts as an interaction**: it produces a real result the
  visitor chose to see, so it can trigger `calculator_complete`.
- **Leaving mid-pause doesn't lose the report**: a pending result is sent on
  `pagehide`.
- **No duplicates**: calculator events are decided in one place
  (`createCalculatorTracker`, unit-tested); link clicks are handled by a single
  delegated listener in the shared layout (`wireLinkTracking`).

### Enhanced measurement (GA4's automatic events)

Leave **page views, scrolls, and outbound clicks** on. **Turn off "Form
interactions"**: the calculators are `<form>` elements, so GA4 fires its own
`form_start` on the first keystroke, which duplicates what `calculator_*`
already measures — and they're never "submitted", so `form_submit` is
meaningless here. Steps are below.

## GA4 admin setup (one-time)

GA4 doesn't show event parameters in reports until they're registered as
custom dimensions, and **only from the moment of registration** — earlier
events can't be broken down retroactively. Do this first.

### 1. Register custom dimensions

GA4 → **Admin** (gear, bottom left) → under *Data display*, **Custom
definitions** → **Create custom dimension**. Create each row (Scope: **Event**):

| Dimension name | Event parameter |
|---|---|
| Calculator | `calculator_id` |
| Destination | `destination` |
| Preset index | `preset_index` |

Then the **Custom metrics** tab → **Create custom metric** (Scope: Event,
Unit: Standard):

| Metric name | Event parameter |
|---|---|
| Adjustment count | `adjustment_count` |
| Prefilled fields | `prefilled_field_count` |
| Error count | `error_count` |

### 2. Mark completion as a key event

Admin → *Data display* → **Events**. `calculator_complete` appears there after
it has fired at least once (up to 24 hours after the deploy). Toggle **Mark as
key event**. If it isn't listed yet: **Key events** → **New key event** →
type `calculator_complete` → Save.

### 3. Turn off form-interaction tracking

Admin → *Data collection and modification* → **Data streams** → click the web
stream for thebusinesscalc.com → **Enhanced measurement** → the gear icon →
switch off **Form interactions** → **Save**.

### 4. Optional: exclude your own visits

Admin → Data streams → your stream → **Configure tag settings** → **Show
more** → **Define internal traffic** → **Create**: rule name `Owner`,
`traffic_type` value `internal`, IP address *equals* your home IP (search
"what is my IP"). Then Admin → *Data collection and modification* → **Data
filters** → the "Internal Traffic" filter → change *Testing* to **Active**.
Your IP can change, so check it occasionally.

### 5. Optional: longer data retention

Admin → *Data collection and modification* → **Data retention** → Event data
retention: **14 months** → Save. (Standard reports aren't affected; this
matters for Explorations.)

## Measuring whether the site works

Two sources, joined on page path:

**Google Search Console**: impressions, clicks, CTR, average position, per page
and per query.

**GA4**: views, `calculator_complete`, `prefilled_result_view`, and engagement,
per page. In Reports → Engagement → Events, add the **Calculator** dimension
(available once registered) to split events by tool.

The ratios worth watching per calculator:

```
completion rate      = calculator_complete ÷ page views of that calculator
depth of use         = calculator_adjust ÷ calculator_complete
shared-link reach    = prefilled_result_view ÷ page views
```

A page earning impressions but with a low completion rate is usually a
mismatch between the query and what the tool actually answers — a content
problem, not a traffic problem. A page with a high completion rate and few
impressions is a visibility problem.

### What these numbers can't tell you

- **Ad blockers and privacy browsers** block GA4 for a share of visitors, so
  GA4 counts are a floor, not a total. Cloudflare Web Analytics (if enabled)
  counts differently, and the two won't match.
- **EEA/UK/CH visitors** without consent send cookieless pings, which Google
  models; treat their numbers as estimates.
- **Bots**: GA4 silently drops known bots and doesn't report how many.
  Cloudflare Pages keeps no request logs, so raw bot traffic isn't inspectable.

Add revenue per page only once monetisation exists.

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
