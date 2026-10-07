import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import { buildSecurityHeaders, resolveOrigin } from "@repo/seo";
import { defineConfig } from "astro/config";
// Importing site.config.ts here means an invalid config throws during
// `astro build`/`astro dev` startup, before any page is rendered.
import { siteConfig } from "./site.config.ts";
import { tools } from "./src/tools.ts";

const origin = resolveOrigin(siteConfig);

/** Tool pages report their real content date; other pages omit lastmod. */
const lastmodByUrl = new Map(tools.map((tool) => [`${origin}${tool.href}`, tool.updated]));

/**
 * Writes Cloudflare Pages' `_headers` into the build output, generated from
 * the site config so the CSP always matches what the pages load (analytics,
 * ads). See buildSecurityHeaders() in @repo/seo.
 */
const securityHeaders = {
  name: "security-headers",
  hooks: {
    "astro:build:done": ({ dir }) => {
      writeFileSync(fileURLToPath(new URL("_headers", dir)), buildSecurityHeaders(siteConfig));
    },
  },
};

export default defineConfig({
  site: origin,
  output: "static",
  trailingSlash: "never",
  // Emit /break-even.html rather than /break-even/index.html. Cloudflare Pages
  // serves a .html file at its extensionless path, but 308-redirects a
  // directory index to the trailing-slash form — which would put every
  // canonical URL, sitemap entry, and internal link behind a redirect.
  build: { format: "file" },
  integrations: [
    sitemap({
      serialize(item) {
        const lastmod = lastmodByUrl.get(item.url.replace(/\/$/, ""));
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    securityHeaders,
  ],
});
