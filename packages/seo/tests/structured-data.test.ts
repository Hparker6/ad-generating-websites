import { describe, expect, it } from "vitest";
import { validateSiteConfig } from "../src/site-config";
import {
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  buildWebApplicationJsonLd,
} from "../src/structured-data";

const config = validateSiteConfig({
  siteId: "example-calculator",
  siteName: "Example Calculator",
  domain: "example.com",
  organizationName: "Example Org",
  defaultDescription: "A simple example calculator.",
  defaultOgImage: "/og-default.png",
  themeColor: "#1d4ed8",
  contactEmail: "hello@example.com",
  analytics: { ga4MeasurementId: "G-PLACEHOLDER" },
  ads: { enabled: false },
});

describe("buildWebApplicationJsonLd", () => {
  it("does not include any rating or review fields", () => {
    const jsonLd = buildWebApplicationJsonLd(config, {
      name: "Tip Calculator",
      description: "Calculate tips fast.",
      path: "/",
      applicationCategory: "Utility",
    });
    expect(jsonLd).not.toHaveProperty("aggregateRating");
    expect(jsonLd).not.toHaveProperty("review");
    expect(jsonLd.url).toBe("https://example.com/");
    expect(jsonLd).not.toHaveProperty("dateModified");
  });

  it("includes dateModified only when one is given", () => {
    const jsonLd = buildWebApplicationJsonLd(config, {
      name: "Tip Calculator",
      description: "Calculate tips fast.",
      path: "/",
      applicationCategory: "Utility",
      dateModified: "2026-10-06",
    });
    expect(jsonLd.dateModified).toBe("2026-10-06");
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("assigns sequential positions", () => {
    const jsonLd = buildBreadcrumbJsonLd(config, [
      { name: "Home", path: "/" },
      { name: "Privacy", path: "/privacy" },
    ]);
    const items = jsonLd.itemListElement as Array<{ position: number }>;
    expect(items.map((i) => i.position)).toEqual([1, 2]);
  });
});

describe("buildOrganizationJsonLd", () => {
  it("uses the configured organization name", () => {
    const jsonLd = buildOrganizationJsonLd(config);
    expect(jsonLd.name).toBe("Example Org");
  });
});
