import type { APIRoute } from "astro";
import { buildAdsTxt } from "@repo/seo";
import { siteConfig } from "../../site.config.ts";

/** /ads.txt — authorizes the configured AdSense publisher (IAB ads.txt spec). */
export const GET: APIRoute = () =>
  new Response(buildAdsTxt(siteConfig), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
