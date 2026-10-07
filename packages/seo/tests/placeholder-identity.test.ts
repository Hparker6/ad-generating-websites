import { describe, expect, it } from "vitest";
import {
  PLACEHOLDER_ORGANIZATION_NAME,
  hasPlaceholderContactEmail,
  hasPlaceholderOrganization,
  validateSiteConfig,
} from "../src/site-config";

function configWith(overrides: Record<string, unknown>) {
  return validateSiteConfig({
    siteId: "example-calculator",
    siteName: "Example Calculator",
    domain: null,
    organizationName: PLACEHOLDER_ORGANIZATION_NAME,
    defaultDescription: "A simple example calculator.",
    defaultOgImage: "/og-default.png",
    themeColor: "#1d4ed8",
    contactEmail: "placeholder@example.com",
    analytics: { ga4MeasurementId: "G-PLACEHOLDER" },
    ads: { enabled: false },
    ...overrides,
  });
}

describe("hasPlaceholderOrganization", () => {
  it("detects the shipped template placeholder", () => {
    expect(hasPlaceholderOrganization(configWith({}))).toBe(true);
  });

  it("is false once a real business name is set", () => {
    expect(hasPlaceholderOrganization(configWith({ organizationName: "Acme LLC" }))).toBe(false);
  });
});

describe("hasPlaceholderContactEmail", () => {
  it("detects RFC 2606 reserved example domains", () => {
    for (const email of [
      "placeholder@example.com",
      "hi@example.org",
      "hi@example.net",
      "hi@anything.test",
      "hi@foo.invalid",
    ]) {
      expect(hasPlaceholderContactEmail(configWith({ contactEmail: email }))).toBe(true);
    }
  });

  it("is false for a real address", () => {
    expect(hasPlaceholderContactEmail(configWith({ contactEmail: "hello@acme.co" }))).toBe(false);
  });

  it("ignores casing and surrounding whitespace", () => {
    expect(hasPlaceholderContactEmail(configWith({ contactEmail: "Hi@Example.COM" }))).toBe(true);
  });
});
