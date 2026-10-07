import { describe, expect, it } from "vitest";
import { GA4_PLACEHOLDER_ID, isAnalyticsEnabled, validateSiteConfig } from "../src/site-config.ts";

/**
 * The GA4 measurement ID comes from an environment variable and is
 * interpolated into an inline <script> by Astro's define:vars. Constraining it
 * to GA4's own format means (a) a typo fails the build instead of silently
 * breaking analytics, and (b) no string capable of terminating a script tag
 * can reach that sink in the first place.
 */
function configWith(ga4MeasurementId: string) {
  return {
    siteId: "test-site",
    siteName: "Test Site",
    domain: null,
    organizationName: "Test Org",
    defaultDescription: "A test site used for configuration validation.",
    defaultOgImage: "/og-default.png",
    themeColor: "#0f766e",
    contactEmail: "test@example.com",
    analytics: { ga4MeasurementId },
    ads: { enabled: false },
  };
}

describe("GA4 measurement ID validation", () => {
  it("accepts the placeholder, which leaves analytics disabled", () => {
    const config = validateSiteConfig(configWith(GA4_PLACEHOLDER_ID));
    expect(config.analytics.ga4MeasurementId).toBe(GA4_PLACEHOLDER_ID);
    expect(isAnalyticsEnabled(config)).toBe(false);
  });

  it("accepts a real-looking measurement ID and enables analytics", () => {
    const config = validateSiteConfig(configWith("G-ABC1234567"));
    expect(isAnalyticsEnabled(config)).toBe(true);
  });

  it.each([
    ["script breakout", 'G-X"</script><script>alert(1)</script>'],
    ["closing tag only", "</script>"],
    ["angle brackets", "G-<script>"],
    ["quote injection", 'G-ABC","evil":"1'],
    ["wrong prefix", "UA-12345-1"],
    ["lowercase", "g-abc1234567"],
    ["too short", "G-AB"],
    ["spaces", "G-ABC 1234567"],
    ["newline", "G-ABC\n1234"],
    ["empty string", ""],
  ])("rejects %s", (_label, value) => {
    expect(() => validateSiteConfig(configWith(value))).toThrow();
  });

  it("the rejection message explains the expected shape", () => {
    expect(() => validateSiteConfig(configWith("UA-12345-1"))).toThrow(/G-X{10}|measurement ID/i);
  });
});
