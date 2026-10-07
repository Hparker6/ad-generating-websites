import { GA4_PLACEHOLDER_ID, PLACEHOLDER_ORGANIZATION_NAME, validateSiteConfig } from "@repo/seo";

/**
 * Single source of truth for this site's domain + GA4 ID.
 *
 * Neither a domain nor a GA4 ID has been assigned yet. Both can be set
 * later WITHOUT editing this file or any code, by setting these two
 * environment variables in the Cloudflare Pages project settings:
 *
 *   PUBLIC_SITE_DOMAIN           e.g. "thebusinesscalc.com" (no protocol)
 *   PUBLIC_GA4_MEASUREMENT_ID    e.g. "G-XXXXXXXXXX"
 *
 * Until PUBLIC_SITE_DOMAIN is set, `domain` stays `null`. That puts the
 * whole site in "not production-ready" mode (see @repo/seo's
 * isProductionReady/resolveOrigin): every page is forced to noindex,
 * robots.txt disallows all crawling, and canonical/OG URLs fall back to
 * the Cloudflare Pages preview URL (or http://localhost:4321 locally) —
 * never a made-up permanent-looking domain. See docs/launch-checklist.md.
 */
const envDomain = process.env.PUBLIC_SITE_DOMAIN?.trim();
const domain = envDomain ? envDomain : null;

const envGa4Id = process.env.PUBLIC_GA4_MEASUREMENT_ID?.trim();
const ga4MeasurementId = envGa4Id ? envGa4Id : GA4_PLACEHOLDER_ID;

// Optional at launch. While unset, the footer credits the site name and the
// contact/privacy pages say no inbox is published yet.
//   PUBLIC_CONTACT_EMAIL         e.g. "hello@thebusinesscalc.com"
//   PUBLIC_ORGANIZATION_NAME     e.g. "Jane Doe" or "Acme Tools LLC"
const contactEmail = process.env.PUBLIC_CONTACT_EMAIL?.trim() || "placeholder@example.com";
const organizationName = process.env.PUBLIC_ORGANIZATION_NAME?.trim() || PLACEHOLDER_ORGANIZATION_NAME;

// AdSense, in two stages (see docs/operations-checklist.md, section 4):
//   1. Apply: set PUBLIC_ADSENSE_CLIENT_ID only. The verification meta tag and
//      a real /ads.txt ship; no ads load and the CSP stays strict.
//   2. Approved: also set PUBLIC_ADS_ENABLED=true. The loader script runs
//      (Auto ads), and PUBLIC_ADSENSE_SLOT_IN_CONTENT, if set, fills the
//      in-content slot on every page with that ad unit.
const adsenseClientId = process.env.PUBLIC_ADSENSE_CLIENT_ID?.trim() || undefined;
const adsEnabled = process.env.PUBLIC_ADS_ENABLED?.trim().toLowerCase() === "true";
const inContentSlotId = process.env.PUBLIC_ADSENSE_SLOT_IN_CONTENT?.trim() || undefined;

export const siteConfig = validateSiteConfig({
  siteId: "pricing-calculators",
  siteName: "The Business Calc",
  domain,
  organizationName,
  defaultDescription:
    "Free calculators for small-business pricing: break-even point, markup vs. margin, selling price, discounts, price increases, food cost, and freelance rates. See the formulas, not just the answer.",
  defaultOgImage: "/og-default.png",
  locale: "en-US",
  themeColor: "#0f766e",
  contactEmail,
  analytics: {
    ga4MeasurementId,
  },
  ads: {
    enabled: adsEnabled,
    provider: "adsense",
    clientId: adsenseClientId,
    inContentSlotId,
  },
  social: {
    twitter: undefined,
  },
});
