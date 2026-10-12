#!/usr/bin/env node
/**
 * Post-build SEO and quality gate for a static site's dist/ folder. No server,
 * no dependencies: reads the sitemap and every page it lists, and fails (exit
 * 1) on anything that would hurt indexing or signal thin, duplicated pages.
 *
 * Usage: node scripts/check-site.mjs <distDir> <origin>
 *   e.g. node scripts/check-site.mjs sites/pricing-calculators/dist https://thebusinesscalc.com
 *
 * Build with PUBLIC_SITE_DOMAIN set so canonicals use the real origin.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const [distDir, origin] = process.argv.slice(2);
if (!distDir || !origin) {
  console.error("Usage: node scripts/check-site.mjs <distDir> <origin>");
  process.exit(2);
}

const MIN_INBOUND_LINKS = 3;
const MAX_TITLE = 60;
const DESCRIPTION = [70, 160];
/** Tool pages sharing more than this fraction of 5-word phrases are flagged as near-duplicates. */
const MAX_SIMILARITY = 0.5;

const problems = [];
const problem = (path, message) => problems.push(`${path}: ${message}`);

const decode = (text) =>
  text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const first = (html, re) => decode(html.match(re)?.[1] ?? "");

function fileFor(path) {
  // build.format "file": /break-even → break-even.html, / → index.html
  return join(distDir, path === "/" ? "index.html" : `${path.slice(1)}.html`);
}

function visibleText(html) {
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? html;
  return decode(
    main
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      // The related-tools block repeats other pages' summaries by design.
      .replace(/<section class="section">\s*<h2 class="section-title">Related calculators[\s\S]*?<\/section>/g, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .toLowerCase()
    .replace(/[^a-z0-9%$.]+/g, " ")
    .trim();
}

function shingles(text, size = 5) {
  const words = text.split(" ");
  const set = new Set();
  for (let i = 0; i + size <= words.length; i++) set.add(words.slice(i, i + size).join(" "));
  return set;
}

function jaccard(a, b) {
  let shared = 0;
  for (const s of a) if (b.has(s)) shared++;
  return shared / (a.size + b.size - shared || 1);
}

// 1. Sitemap → URL list.
const sitemapPath = join(distDir, "sitemap-0.xml");
if (!existsSync(sitemapPath)) {
  console.error(`No sitemap at ${sitemapPath}`);
  process.exit(1);
}
const urls = [...readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const paths = urls.map((url) => {
  if (!url.startsWith(origin)) problem(url, `sitemap URL not on ${origin}`);
  return url.slice(origin.length) || "/";
});

// 2. Per-page checks.
const inbound = new Map(paths.map((p) => [p, new Set()]));
const titles = new Map();
const descriptions = new Map();
const toolTexts = [];

for (const path of paths) {
  const file = fileFor(path);
  if (!existsSync(file)) {
    problem(path, `listed in sitemap but ${file} is missing`);
    continue;
  }
  const html = readFileSync(file, "utf8");
  const url = origin + (path === "/" ? "/" : path);

  const title = first(html, /<title>([\s\S]*?)<\/title>/);
  const description = first(html, /<meta name="description" content="([^"]*)"/);
  const canonical = first(html, /<link rel="canonical" href="([^"]*)"/);
  const robots = first(html, /<meta name="robots" content="([^"]*)"/);
  const h1s = html.match(/<h1[\s>]/g)?.length ?? 0;

  if (!title) problem(path, "missing <title>");
  else if (title.length > MAX_TITLE) problem(path, `title is ${title.length} chars (max ${MAX_TITLE}): "${title}"`);
  if (description.length < DESCRIPTION[0] || description.length > DESCRIPTION[1])
    problem(path, `description is ${description.length} chars (want ${DESCRIPTION[0]}–${DESCRIPTION[1]})`);
  if (canonical !== url) problem(path, `canonical "${canonical}" should be "${url}"`);
  if (robots !== "index, follow") problem(path, `robots meta is "${robots}"`);
  if (h1s !== 1) problem(path, `${h1s} <h1> elements`);

  if (titles.has(title)) problem(path, `duplicate title with ${titles.get(title)}`);
  titles.set(title, path);
  if (descriptions.has(description)) problem(path, `duplicate description with ${descriptions.get(description)}`);
  descriptions.set(description, path);

  let isTool = false;
  for (const [, block] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(block);
      if (data["@context"] !== "https://schema.org") problem(path, "JSON-LD @context is not https://schema.org");
      if (data["@type"] === "BreadcrumbList") {
        isTool = true;
        const last = data.itemListElement?.at(-1)?.item;
        if (last !== url) problem(path, `breadcrumb ends at ${last}, not the page URL`);
      }
      if ((data["@type"] === "WebApplication" || data["@type"] === "WebSite") && data.url !== url)
        problem(path, `${data["@type"]} url ${data.url} isn't the page URL`);
    } catch (error) {
      problem(path, `invalid JSON-LD: ${error.message}`);
    }
  }

  // Calculator forms must report under their own slug.
  const calculatorId = html.match(/data-calculator-id="([^"]*)"/)?.[1];
  if (calculatorId !== undefined && calculatorId !== path.slice(1))
    problem(path, `data-calculator-id "${calculatorId}" doesn't match the URL slug`);

  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const target = href.replace(/\/$/, "") || "/";
    if (target !== path && inbound.has(target)) inbound.get(target).add(path);
  }

  if (isTool) toolTexts.push({ path, set: shingles(visibleText(html)) });
}

// 3. Internal linking: every page reachable from at least N others.
for (const [path, from] of inbound) {
  if (from.size < MIN_INBOUND_LINKS) problem(path, `only ${from.size} internal pages link here (min ${MIN_INBOUND_LINKS})`);
}

// 4. Uniqueness across tool pages.
let closest = { score: 0, pair: "" };
for (let i = 0; i < toolTexts.length; i++) {
  for (let j = i + 1; j < toolTexts.length; j++) {
    const score = jaccard(toolTexts[i].set, toolTexts[j].set);
    if (score > closest.score) closest = { score, pair: `${toolTexts[i].path} ↔ ${toolTexts[j].path}` };
    if (score > MAX_SIMILARITY)
      problem(toolTexts[i].path, `${(score * 100).toFixed(0)}% similar to ${toolTexts[j].path} (max ${MAX_SIMILARITY * 100}%)`);
  }
}

console.log(`Checked ${paths.length} sitemap pages (${toolTexts.length} tool pages).`);
console.log(`Most similar tool pages: ${closest.pair || "n/a"} at ${(closest.score * 100).toFixed(1)}%.`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log("All checks passed.");
