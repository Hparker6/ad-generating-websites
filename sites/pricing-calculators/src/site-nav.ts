import type { FooterColumn, NavItem } from "@repo/ui";
import { tools } from "./tools";

/**
 * Header navigation: the most-searched tools plus a link to the full list.
 * The complete set lives on the homepage and in the footer.
 */
const headerTools = [
  "/break-even",
  "/markup-vs-margin",
  "/selling-price",
  "/discount-calculator",
  "/food-cost-calculator",
  "/freelance-hourly-rate",
];

export const navItems: NavItem[] = [
  ...tools
    .filter((tool) => headerTools.includes(tool.href))
    .map((tool) => ({ label: tool.navLabel, href: tool.href })),
  { label: "All tools", href: "/" },
];

const toLink = (tool: (typeof tools)[number]) => ({ label: tool.navLabel, href: tool.href });

export const footerColumns: FooterColumn[] = [
  {
    heading: "Profit calculators",
    links: tools.filter((tool) => tool.group === "core").map(toLink),
  },
  {
    heading: "Pricing tools",
    links: tools.filter((tool) => tool.group === "pricing").map(toLink),
  },
  {
    heading: "Site",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms of use", href: "/terms" },
    ],
  },
];

export const footerTagline =
  "Free pricing and profitability calculators that show the formula behind every number.";
