import type { APIRoute } from "astro";
import { canonicalUrl } from "@repo/seo";
import { siteConfig } from "../../site.config.ts";
import { tools } from "../tools.ts";

/**
 * /llms.txt — a plain-Markdown index for AI assistants and agents (see
 * llmstxt.org). Generated from the same tool registry as the navigation, so
 * it can't drift from the pages that actually exist.
 */
export const GET: APIRoute = () => {
  const section = (group: "core" | "pricing") =>
    tools
      .filter((tool) => tool.group === group)
      .map((tool) => {
        const params = tool.params.length > 0 ? ` Query parameters: ${tool.params.join(", ")}.` : "";
        return `- [${tool.name}](${canonicalUrl(siteConfig, tool.href)}): ${tool.summary} Formula: ${tool.formula}.${params}`;
      })
      .join("\n");

  const body = `# ${siteConfig.siteName}

> ${siteConfig.defaultDescription}

All calculators run entirely in the browser and use standard cost-accounting definitions. Each page shows the formula, a worked example, and an FAQ.

Calculator pages accept their inputs as URL query parameters, so a link can open with a result already filled in — for example ${canonicalUrl(siteConfig, "/markup-vs-margin")}?unitCost=60&sellingPrice=100. Each tool's parameter names are listed below.

## Profit calculators

${section("core")}

## Pricing tools

${section("pricing")}

## About

- [About](${canonicalUrl(siteConfig, "/about")}): What the site covers and what it doesn't claim to do.
- [Privacy policy](${canonicalUrl(siteConfig, "/privacy")}): What is and isn't collected.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
