import type { SiteConfig } from "./site-config.ts";
import { isAdsActive, isAnalyticsEnabled } from "./site-config.ts";

/**
 * Builds the Cloudflare Pages `_headers` file from the site config, so the
 * Content-Security-Policy always matches what the build actually loads.
 * A hand-maintained policy goes stale the moment analytics or ads are
 * switched on, and a stale CSP fails silently: the script is just blocked.
 *
 * What each source is for:
 *   'unsafe-inline' (script)  the GA4 bootstrap and the AdSense push() are
 *                             inline; static hosting can't issue nonces.
 *   'unsafe-inline' (style)   chart bar widths are set via style attributes.
 *   cloudflareinsights        Cloudflare Web Analytics, which the Pages
 *                             dashboard can inject without a code change.
 *   GA4 hosts                 only when a measurement ID is configured.
 *   ads → https:, eval        AdSense, its consent manager (Funding Choices)
 *                             and ad-quality scripts load from a long,
 *                             changing list of Google and partner hosts, and
 *                             Google's own CSP guidance for ad tags includes
 *                             'unsafe-eval'. Allowing https: is the
 *                             practical choice on a static site with no
 *                             accounts, cookies of its own, or forms.
 */
export function buildSecurityHeaders(config: SiteConfig): string {
  const analytics = isAnalyticsEnabled(config);
  const ads = isAdsActive(config);

  const script = ["'self'", "'unsafe-inline'", "https://static.cloudflareinsights.com"];
  const img = ["'self'", "data:"];
  const connect = ["'self'", "https://cloudflareinsights.com"];
  const frame = ["'none'"];

  if (analytics) {
    script.push("https://www.googletagmanager.com");
    img.push("https://www.googletagmanager.com", "https://*.google-analytics.com");
    connect.push(
      "https://www.googletagmanager.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com"
    );
  }

  if (ads) {
    script.push("'unsafe-eval'", "https:");
    img.push("https:");
    connect.push("https:");
    frame.splice(0, frame.length, "https:");
  }

  const csp = [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img.join(" ")}`,
    "font-src 'self'",
    `connect-src ${connect.join(" ")}`,
    `frame-src ${frame.join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  return [
    "# Generated at build time by buildSecurityHeaders() in @repo/seo.",
    "# Edit that function, not this file — it is overwritten on every build.",
    "",
    "/*",
    `  Content-Security-Policy: ${csp}`,
    "  Strict-Transport-Security: max-age=31536000; includeSubDomains",
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    "  X-Frame-Options: DENY",
    // Ad clicks open the advertiser in a new window; a strict COOP severs
    // that window relationship, which ad click-tracking relies on.
    `  Cross-Origin-Opener-Policy: ${ads ? "same-origin-allow-popups" : "same-origin"}`,
    "  Cross-Origin-Resource-Policy: same-origin",
    "",
    "# Astro fingerprints everything under /_astro/, so it is safe to cache forever.",
    "# HTML keeps Cloudflare Pages' default (revalidate on every request).",
    "/_astro/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
  ].join("\n");
}
