import { afterEach, describe, expect, it } from "vitest";
import { validateSiteConfig } from "../src/site-config";
import { buildMeta } from "../src/meta";

const baseConfig = {
  siteId: "example-calculator",
  siteName: "Example Calculator",
  organizationName: "Example Org",
  defaultDescription: "A simple example calculator.",
  defaultOgImage: "/og-default.png",
  themeColor: "#1d4ed8",
  contactEmail: "hello@example.com",
  analytics: { ga4MeasurementId: "G-PLACEHOLDER" },
  ads: { enabled: false },
};

describe("buildMeta", () => {
  afterEach(() => {
    delete process.env.CF_PAGES_URL;
  });

  it("indexes a page once a real domain is configured", () => {
    const config = validateSiteConfig({ ...baseConfig, domain: "example.com" });
    const meta = buildMeta(config, { title: "Home", path: "/" });
    expect(meta.robots).toBe("index, follow");
    expect(meta.canonical).toBe("https://example.com/");
  });

  it("forces noindex sitewide when no domain is configured yet, even for an indexable page", () => {
    const config = validateSiteConfig({ ...baseConfig, domain: null });
    const meta = buildMeta(config, { title: "Home", path: "/" });
    expect(meta.robots).toBe("noindex, nofollow");
  });

  it("still respects an explicit per-page noindex once production-ready", () => {
    const config = validateSiteConfig({ ...baseConfig, domain: "example.com" });
    const meta = buildMeta(config, { title: "Thanks", path: "/thanks", noindex: true });
    expect(meta.robots).toBe("noindex, nofollow");
  });

  it("uses the page title and falls back to the site default description", () => {
    const config = validateSiteConfig({ ...baseConfig, domain: "example.com" });
    const meta = buildMeta(config, { title: "Home", path: "/" });
    expect(meta.title).toBe("Home | Example Calculator");
    expect(meta.description).toBe("A simple example calculator.");
  });
});
