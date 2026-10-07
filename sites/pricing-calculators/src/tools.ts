import { buildBreadcrumbJsonLd, buildWebApplicationJsonLd } from "@repo/seo";
import { siteConfig } from "../site.config.ts";

/**
 * Every tool on the site, in one place. Navigation, the homepage, the footer,
 * breadcrumbs, structured data, and /llms.txt all read from this list, so a
 * new page only has to be registered here to show up everywhere.
 */
export interface Tool {
  /** URL path, e.g. "/break-even". */
  href: string;
  /** Full page name, also the H1 and breadcrumb label. */
  name: string;
  /** Short label for navigation. */
  navLabel: string;
  /** The question the tool answers, used on the homepage. */
  question: string;
  /** One-sentence summary for llms.txt and cards. */
  summary: string;
  /** The core formula in plain text, for llms.txt. */
  formula: string;
  /** Input ids, which double as URL query parameters for prefilling. */
  params: string[];
  group: "core" | "pricing";
  /** ISO date the page's content was last revised. */
  updated: string;
}

export const tools: Tool[] = [
  {
    href: "/break-even",
    name: "Break-Even Calculator",
    navLabel: "Break-even",
    question: "How many units must I sell to stop losing money?",
    summary: "Finds the number of units and the revenue needed to cover fixed costs.",
    formula: "break-even units = fixed costs ÷ (price − variable cost per unit)",
    params: ["fixedCosts", "pricePerUnit", "variableCostPerUnit"],
    group: "core",
    updated: "2026-10-06",
  },
  {
    href: "/target-profit",
    name: "Target Profit Calculator",
    navLabel: "Target profit",
    question: "What gets me to a profit goal?",
    summary: "Finds the units and revenue needed to reach a specific profit goal.",
    formula: "units needed = (fixed costs + profit goal) ÷ (price − variable cost per unit)",
    params: ["fixedCosts", "pricePerUnit", "variableCostPerUnit", "desiredProfit"],
    group: "core",
    updated: "2026-10-06",
  },
  {
    href: "/contribution-margin",
    name: "Contribution Margin Calculator",
    navLabel: "Contribution margin",
    question: "What does each sale contribute?",
    summary: "Calculates contribution margin per unit in dollars and as a ratio of price.",
    formula: "contribution margin = price − variable cost; ratio = contribution margin ÷ price",
    params: ["sellingPrice", "variableCost"],
    group: "core",
    updated: "2026-10-06",
  },
  {
    href: "/markup-vs-margin",
    name: "Markup vs. Margin Calculator",
    navLabel: "Markup vs. margin",
    question: "Is that a markup or a margin?",
    summary: "Converts a cost and price into both markup % and margin %, and shows why they differ.",
    formula: "markup % = (price − cost) ÷ cost × 100; margin % = (price − cost) ÷ price × 100",
    params: ["unitCost", "sellingPrice"],
    group: "core",
    updated: "2026-10-06",
  },
  {
    href: "/selling-price",
    name: "Selling Price Calculator",
    navLabel: "Selling price",
    question: "What price should I charge?",
    summary: "Finds the selling price that delivers a target gross margin on a known cost.",
    formula: "price = cost ÷ (1 − target margin ÷ 100)",
    params: ["unitCost", "desiredMarginPercent"],
    group: "core",
    updated: "2026-10-06",
  },
  {
    href: "/markup-margin-chart",
    name: "Markup to Margin Conversion Chart",
    navLabel: "Markup ↔ margin chart",
    question: "What margin does a 50% markup give?",
    summary: "Reference table converting common markup percentages to margins and back.",
    formula: "margin = markup ÷ (1 + markup); markup = margin ÷ (1 − margin)",
    params: [],
    group: "pricing",
    updated: "2026-10-06",
  },
  {
    href: "/discount-calculator",
    name: "Discount Profit Calculator",
    navLabel: "Discounts",
    question: "How many more sales does a discount need?",
    summary: "Shows how much extra volume a discount needs to keep the same gross profit.",
    formula: "extra volume % = (old profit per unit ÷ new profit per unit − 1) × 100",
    params: ["currentPrice", "unitCost", "discountPercent"],
    group: "pricing",
    updated: "2026-10-06",
  },
  {
    href: "/price-increase-calculator",
    name: "Price Increase Calculator",
    navLabel: "Price increase",
    question: "How many customers can I lose after a price increase?",
    summary: "Shows how much sales volume a price increase can lose before profit drops.",
    formula: "volume you can lose % = (1 − old profit per unit ÷ new profit per unit) × 100",
    params: ["currentPrice", "unitCost", "increasePercent"],
    group: "pricing",
    updated: "2026-10-06",
  },
  {
    href: "/food-cost-calculator",
    name: "Food Cost & Menu Price Calculator",
    navLabel: "Food cost",
    question: "What should this dish cost on the menu?",
    summary: "Sets a menu price from plate cost and a target food cost percentage.",
    formula: "menu price = plate cost ÷ (target food cost % ÷ 100)",
    params: ["plateCost", "targetFoodCostPercent"],
    group: "pricing",
    updated: "2026-10-06",
  },
  {
    href: "/freelance-hourly-rate",
    name: "Freelance Hourly Rate Calculator",
    navLabel: "Hourly rate",
    question: "What hourly rate do I need as a freelancer?",
    summary: "Works out the hourly and day rate needed to hit a take-home income after tax and expenses.",
    formula: "hourly rate = (income ÷ (1 − tax rate) + expenses) ÷ (billable hours per week × weeks)",
    params: ["targetIncome", "annualExpenses", "taxRatePercent", "billableHoursPerWeek", "weeksPerYear"],
    group: "pricing",
    updated: "2026-10-06",
  },
];

export function getTool(href: string): Tool {
  const tool = tools.find((candidate) => candidate.href === href);
  if (!tool) throw new Error(`No tool registered for ${href}`);
  return tool;
}

/** "October 6, 2026" — the visible form of a tool's `updated` date. */
export function formatUpdated(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** WebApplication + BreadcrumbList JSON-LD for a tool page. */
export function toolStructuredData(tool: Tool, description: string): Record<string, unknown>[] {
  return [
    buildWebApplicationJsonLd(siteConfig, {
      name: tool.name,
      description,
      path: tool.href,
      applicationCategory: "BusinessApplication",
      dateModified: tool.updated,
    }),
    buildBreadcrumbJsonLd(siteConfig, [
      { name: "Home", path: "/" },
      { name: tool.name, path: tool.href },
    ]),
  ];
}
