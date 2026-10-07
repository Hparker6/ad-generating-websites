#!/usr/bin/env node
/**
 * Validates every site's config without doing a full Astro build. Each
 * site's astro.config.mjs imports its site.config.ts, which calls
 * validateSiteConfig() at module load time — so importing the config here
 * triggers the exact same zod validation (and the same readable error
 * listing every missing/invalid field) that a real build would hit.
 */
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const sitesDir = path.resolve(import.meta.dirname, "..", "sites");
const siteNames = readdirSync(sitesDir).filter((name) =>
  statSync(path.join(sitesDir, name)).isDirectory()
);

if (siteNames.length === 0) {
  console.log("No sites found under sites/.");
  process.exit(0);
}

let hadFailure = false;

for (const name of siteNames) {
  const configPath = path.join(sitesDir, name, "astro.config.mjs");
  try {
    const mod = await import(pathToFileURL(configPath).href);
    console.log(`✓ ${name} (site: ${mod.default.site})`);
  } catch (error) {
    hadFailure = true;
    console.error(`✗ ${name}`);
    console.error(error instanceof Error ? error.message : error);
    console.error("");
  }
}

if (hadFailure) {
  process.exit(1);
}
