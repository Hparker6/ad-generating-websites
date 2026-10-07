import type { SiteConfig } from "./site-config.ts";
import { canonicalUrl, isProductionReady } from "./site-config.ts";

export interface PageSeo {
  /** Page-specific title. Site name is appended by buildMeta via titleTemplate. */
  title: string;
  /** Page-specific description. Falls back to config.defaultDescription if omitted. */
  description?: string;
  /** Path for the canonical URL, e.g. "/" or "/privacy". */
  path: string;
  /** Overrides config.defaultOgImage for this page. */
  ogImage?: string;
  /** Set true for pages that shouldn't be indexed (e.g. thank-you pages). */
  noindex?: boolean;
}

export interface ResolvedMeta {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  robots: string;
}

export function buildMeta(config: SiteConfig, page: PageSeo): ResolvedMeta {
  // Until a real production domain is configured, force noindex sitewide so a
  // preview/localhost build can never get indexed under a throwaway URL.
  const indexable = isProductionReady(config) && !page.noindex;
  return {
    title: `${page.title} | ${config.siteName}`,
    description: page.description ?? config.defaultDescription,
    canonical: canonicalUrl(config, page.path),
    ogImage: canonicalUrl(config, page.ogImage ?? config.defaultOgImage),
    robots: indexable ? "index, follow" : "noindex, nofollow",
  };
}
