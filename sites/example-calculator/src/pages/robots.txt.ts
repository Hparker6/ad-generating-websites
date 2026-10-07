import type { APIRoute } from "astro";
import { canonicalUrl, isProductionReady } from "@repo/seo";
import { siteConfig } from "../../site.config.ts";

export const GET: APIRoute = () => {
  // Disallow all crawling until a real production domain is configured, so a
  // preview/localhost build is never indexed under a throwaway URL.
  const body = [
    "User-agent: *",
    isProductionReady(siteConfig) ? "Allow: /" : "Disallow: /",
    `Sitemap: ${canonicalUrl(siteConfig, "/sitemap-index.xml")}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
};
