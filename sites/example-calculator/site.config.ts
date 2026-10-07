import { GA4_PLACEHOLDER_ID, validateSiteConfig } from "@repo/seo";

/**
 * This is the example/placeholder site. When creating a real site, copy
 * this folder and replace every value below — see /docs/adding-a-site.md.
 *
 * validateSiteConfig() throws on any missing/invalid required field, so an
 * incomplete config fails the build here rather than shipping broken SEO
 * metadata or analytics.
 */
export const siteConfig = validateSiteConfig({
  siteId: "example-calculator",
  siteName: "Example Calculator",
  domain: "example-calculator.pages.dev", // TODO: replace with your real domain before launch
  organizationName: "Your Company Name", // TODO
  defaultDescription:
    "A free, fast tip calculator. Split the bill and tip between any number of people.",
  defaultOgImage: "/og-default.png",
  locale: "en-US",
  themeColor: "#1d4ed8",
  contactEmail: "placeholder@example.com", // TODO: real contact before launch
  analytics: {
    // TODO: replace with a real GA4 measurement ID, e.g. "G-XXXXXXXXXX",
    // or leave as the placeholder to keep analytics fully disabled.
    ga4MeasurementId: GA4_PLACEHOLDER_ID,
  },
  ads: {
    // Flip to true only once an ad network has actually approved this site.
    enabled: false,
    provider: "adsense",
    clientId: undefined,
  },
  social: {
    twitter: undefined,
  },
});
