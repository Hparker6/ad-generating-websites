import { afterEach, describe, expect, it } from "vitest";
import {
  GA4_PLACEHOLDER_ID,
  LOCAL_DEV_ORIGIN,
  canonicalUrl,
  isAnalyticsEnabled,
  isProductionReady,
  resolveOrigin,
  validateSiteConfig,
} from "../src/site-config";

const validConfig = {
  siteId: "example-calculator",
  siteName: "Example Calculator",
  domain: "example.com",
  organizationName: "Example Org",
  defaultDescription: "A simple example calculator.",
  defaultOgImage: "/og-default.png",
  themeColor: "#1d4ed8",
  contactEmail: "hello@example.com",
  analytics: { ga4MeasurementId: GA4_PLACEHOLDER_ID },
  ads: { enabled: false },
};

describe("validateSiteConfig", () => {
  it("accepts a fully valid config", () => {
    const result = validateSiteConfig(validConfig);
    expect(result.siteId).toBe("example-calculator");
    expect(result.locale).toBe("en-US");
  });

  it("throws when required fields are missing", () => {
    const { domain, ...incomplete } = validConfig;
    expect(() => validateSiteConfig(incomplete)).toThrow(/domain/);
  });

  it("throws when domain includes a protocol", () => {
    expect(() =>
      validateSiteConfig({ ...validConfig, domain: "https://example.com" })
    ).toThrow();
  });

  it("throws when contactEmail is not an email", () => {
    expect(() =>
      validateSiteConfig({ ...validConfig, contactEmail: "not-an-email" })
    ).toThrow();
  });

  it("throws when siteId is not kebab-case", () => {
    expect(() =>
      validateSiteConfig({ ...validConfig, siteId: "Example_Calculator" })
    ).toThrow();
  });
});

describe("canonicalUrl", () => {
  it("builds the root URL with a trailing slash, matching the sitemap's form", () => {
    const config = validateSiteConfig(validConfig);
    expect(canonicalUrl(config, "/")).toBe("https://example.com/");
  });

  it("builds a nested path URL", () => {
    const config = validateSiteConfig(validConfig);
    expect(canonicalUrl(config, "/privacy")).toBe("https://example.com/privacy");
  });

  it("normalizes a path missing a leading slash", () => {
    const config = validateSiteConfig(validConfig);
    expect(canonicalUrl(config, "privacy")).toBe("https://example.com/privacy");
  });
});

describe("domain = null (no production domain configured yet)", () => {
  afterEach(() => {
    delete process.env.CF_PAGES_URL;
  });

  it("accepts a null domain", () => {
    const config = validateSiteConfig({ ...validConfig, domain: null });
    expect(config.domain).toBeNull();
  });

  it("is not production-ready when domain is null", () => {
    const config = validateSiteConfig({ ...validConfig, domain: null });
    expect(isProductionReady(config)).toBe(false);
  });

  it("is production-ready once a domain is set", () => {
    const config = validateSiteConfig(validConfig);
    expect(isProductionReady(config)).toBe(true);
  });

  it("falls back to localhost when no domain and no CF_PAGES_URL", () => {
    const config = validateSiteConfig({ ...validConfig, domain: null });
    expect(resolveOrigin(config)).toBe(LOCAL_DEV_ORIGIN);
  });

  it("falls back to the Cloudflare Pages preview URL when set", () => {
    process.env.CF_PAGES_URL = "https://abc123.example-site.pages.dev/";
    const config = validateSiteConfig({ ...validConfig, domain: null });
    expect(resolveOrigin(config)).toBe("https://abc123.example-site.pages.dev");
  });

  it("builds canonical URLs against the preview origin without doubling the slash", () => {
    process.env.CF_PAGES_URL = "https://abc123.example-site.pages.dev/";
    const config = validateSiteConfig({ ...validConfig, domain: null });
    expect(canonicalUrl(config, "/")).toBe("https://abc123.example-site.pages.dev/");
    expect(canonicalUrl(config, "/break-even")).toBe(
      "https://abc123.example-site.pages.dev/break-even"
    );
  });

  it("prefers the real domain over CF_PAGES_URL once both exist", () => {
    process.env.CF_PAGES_URL = "https://abc123.example-site.pages.dev/";
    const config = validateSiteConfig(validConfig);
    expect(resolveOrigin(config)).toBe("https://example.com");
  });
});

describe("isAnalyticsEnabled", () => {
  it("is false for the placeholder measurement id", () => {
    const config = validateSiteConfig(validConfig);
    expect(isAnalyticsEnabled(config)).toBe(false);
  });

  it("is true for a real-looking measurement id", () => {
    const config = validateSiteConfig({
      ...validConfig,
      analytics: { ga4MeasurementId: "G-ABC1234567" },
    });
    expect(isAnalyticsEnabled(config)).toBe(true);
  });
});
