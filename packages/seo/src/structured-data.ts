import type { SiteConfig } from "./site-config.ts";
import { canonicalUrl } from "./site-config.ts";

/**
 * Structured data builders. These only emit fields we can honestly populate
 * from real config/content — no fabricated ratings, reviews, or review counts.
 */

/**
 * Note: there is deliberately no FAQPage builder here. Google restricted
 * FAQ rich results to government and health sites in 2023, so FAQPage
 * markup earns nothing for a site like this — it was only ever a
 * rich-result play. The FAQs remain visible on the page for readers.
 */

export interface WebApplicationInfo {
  name: string;
  description: string;
  path: string;
  /** e.g. "Utility" or "Finance". Keep broad and accurate. */
  applicationCategory: string;
  /** ISO date (YYYY-MM-DD) the page's content was last revised. */
  dateModified?: string;
}

export function buildWebApplicationJsonLd(
  config: SiteConfig,
  app: WebApplicationInfo
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: app.name,
    description: app.description,
    url: canonicalUrl(config, app.path),
    applicationCategory: app.applicationCategory,
    operatingSystem: "Any (runs in browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    ...(app.dateModified ? { dateModified: app.dateModified } : {}),
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(
  config: SiteConfig,
  items: BreadcrumbItem[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(config, item.path),
    })),
  };
}

export function buildOrganizationJsonLd(config: SiteConfig): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: config.organizationName,
    url: canonicalUrl(config, "/"),
  };
}

/**
 * Serializes a JSON-LD object for embedding inside a <script> element.
 *
 * `JSON.stringify` alone is not safe here: it leaves `<` and `>` intact, so a
 * value containing `</script>` would terminate the element early and the rest
 * would be parsed as HTML. It also leaves U+2028/U+2029 raw, which are literal
 * line terminators in JavaScript source. Escaping them as \u sequences keeps
 * the output valid JSON — a parser reads the identical object back — while
 * making it impossible to break out of the surrounding tag.
 *
 * Nothing user-controlled reaches structured data today. This escapes at the
 * sink so that stays true regardless of what is added upstream later.
 */
// The backslash and the two separator characters are constructed rather than
// written as escapes: in source, "\u003c" is simply the character "<", and a
// literal U+2028 is a line terminator. Building them avoids both traps.
const BACKSLASH = String.fromCharCode(92);
const UNSAFE_IN_SCRIPT = new RegExp("[<>&" + String.fromCharCode(0x2028, 0x2029) + "]", "g");

export function serializeJsonLd(entry: Record<string, unknown>): string {
  return JSON.stringify(entry).replace(
    UNSAFE_IN_SCRIPT,
    (char) => BACKSLASH + "u" + char.charCodeAt(0).toString(16).padStart(4, "0")
  );
}
