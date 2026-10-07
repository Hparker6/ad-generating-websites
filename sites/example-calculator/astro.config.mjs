import sitemap from "@astrojs/sitemap";
import { resolveOrigin } from "@repo/seo";
import { defineConfig } from "astro/config";
// Importing site.config.ts here means an invalid config throws during
// `astro build`/`astro dev` startup, before any page is rendered.
import { siteConfig } from "./site.config.ts";

export default defineConfig({
  site: resolveOrigin(siteConfig),
  output: "static",
  trailingSlash: "never",
  // Emit /break-even.html rather than /break-even/index.html. Cloudflare Pages
  // serves a .html file at its extensionless path, but 308-redirects a
  // directory index to the trailing-slash form — which would put every
  // canonical URL, sitemap entry, and internal link behind a redirect.
  build: { format: "file" },
  integrations: [sitemap()],
});
