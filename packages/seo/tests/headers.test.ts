import { describe, expect, it } from "vitest";
import { buildSecurityHeaders } from "../src/headers";
import { buildAdsTxt, isAdsActive, validateSiteConfig } from "../src/site-config";

function configWith(overrides: { ga4?: string; ads?: Record<string, unknown> } = {}) {
  return validateSiteConfig({
    siteId: "example-calculator",
    siteName: "Example Calculator",
    domain: "example.com",
    organizationName: "Example Org",
    defaultDescription: "A simple example calculator.",
    defaultOgImage: "/og-default.png",
    themeColor: "#1d4ed8",
    contactEmail: "hello@example.com",
    analytics: { ga4MeasurementId: overrides.ga4 ?? "G-PLACEHOLDER" },
    ads: overrides.ads ?? { enabled: false },
  });
}

const cspOf = (headers: string) => headers.match(/Content-Security-Policy: (.*)/)![1];

describe("buildSecurityHeaders", () => {
  it("allows no third-party hosts except Cloudflare Web Analytics when everything is off", () => {
    const csp = cspOf(buildSecurityHeaders(configWith()));
    expect(csp).not.toContain("google");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("https://static.cloudflareinsights.com");
    expect(csp).not.toMatch(/(script|img|connect)-src[^;]* https:(?!\/\/)/);
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("adds GA4 hosts only when a measurement ID is configured", () => {
    const csp = cspOf(buildSecurityHeaders(configWith({ ga4: "G-ABC123XYZ" })));
    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).toContain("https://*.google-analytics.com");
    expect(csp).toContain("frame-src 'none'");
  });

  it("opens script, frame, img and connect to https: once ads are active", () => {
    const headers = buildSecurityHeaders(
      configWith({ ads: { enabled: true, clientId: "ca-pub-1234567890123456" } })
    );
    const csp = cspOf(headers);
    expect(csp).toContain("frame-src https:");
    expect(csp).toMatch(/script-src [^;]*'unsafe-eval'[^;]* https:/);
    expect(headers).toContain("Cross-Origin-Opener-Policy: same-origin-allow-popups");
  });

  it("does not loosen anything when only the publisher ID is set (pre-approval)", () => {
    const headers = buildSecurityHeaders(
      configWith({ ads: { enabled: false, clientId: "ca-pub-1234567890123456" } })
    );
    expect(cspOf(headers)).toContain("frame-src 'none'");
    expect(headers).toContain("Cross-Origin-Opener-Policy: same-origin\n");
  });

  it("never framing-allows the site and keeps fingerprinted assets immutable", () => {
    const headers = buildSecurityHeaders(configWith());
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain("X-Frame-Options: DENY");
    expect(headers).toMatch(/\/_astro\/\*\n {2}Cache-Control: public, max-age=31536000, immutable/);
  });
});

describe("ads config", () => {
  it("rejects a malformed publisher ID", () => {
    expect(() => configWith({ ads: { enabled: false, clientId: "pub-123" } })).toThrow(/ca-pub/);
    expect(() => configWith({ ads: { enabled: false, clientId: 'ca-pub-1"><script>' } })).toThrow();
  });

  it("rejects a non-numeric slot ID", () => {
    expect(() =>
      configWith({ ads: { enabled: false, clientId: "ca-pub-1234567890123456", inContentSlotId: "in-content" } })
    ).toThrow(/numeric/);
  });

  it("refuses to enable ads without a publisher ID", () => {
    expect(() => configWith({ ads: { enabled: true } })).toThrow(/clientId/);
  });

  it("is active only when enabled and a publisher ID is set", () => {
    expect(isAdsActive(configWith({ ads: { enabled: false, clientId: "ca-pub-1234567890123456" } }))).toBe(false);
    expect(isAdsActive(configWith({ ads: { enabled: true, clientId: "ca-pub-1234567890123456" } }))).toBe(true);
  });
});

describe("buildAdsTxt", () => {
  it("authorizes Google as a direct seller for the configured publisher", () => {
    const txt = buildAdsTxt(configWith({ ads: { enabled: false, clientId: "ca-pub-1234567890123456" } }));
    expect(txt).toBe("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0\n");
  });

  it("is a comment-only file without a publisher ID", () => {
    expect(buildAdsTxt(configWith())).toMatch(/^#/);
  });
});
