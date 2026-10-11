import { trackEvent } from "./analytics.ts";

/** The current tool's id: its URL slug ("/markup-vs-margin" → "markup-vs-margin"). */
export function toolIdFromPath(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, "").replace(/\.html$/, "") || "home";
}

/**
 * Tracks the cross-tool links that are the same on every page: the "Next
 * step" link and the "Related calculators" cards. One delegated listener per
 * page, wired from the shared layout, so a click is counted exactly once.
 * Only the internal destination path is sent.
 */
export function wireLinkTracking(doc: Document = document): void {
  doc.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    const link = target?.closest?.<HTMLAnchorElement>("a.next-step, .tool-card a");
    if (!link) return;
    const destination = link.getAttribute("href") ?? "";
    if (!destination.startsWith("/")) return;
    const calculator_id = toolIdFromPath(doc.location.pathname);
    if (link.matches("a.next-step")) {
      trackEvent("next_step_click", { calculator_id, destination });
    } else {
      trackEvent("related_tool_click", { calculator_id, destination });
    }
  });
}
