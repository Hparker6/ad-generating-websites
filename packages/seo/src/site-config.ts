import { z } from "zod";

/**
 * Used as the default GA4 measurement ID in every site's config.
 * The Analytics component treats this value as "analytics disabled"
 * so sites never accidentally send data to a shared/fake property.
 */
export const GA4_PLACEHOLDER_ID = "G-PLACEHOLDER";

const kebabCase = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const domainPattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

export const siteConfigSchema = z.object({
  /** Unique kebab-case id, matches the folder name under sites/. */
  siteId: z.string().regex(kebabCase, "siteId must be kebab-case, e.g. 'example-calculator'"),

  /** Human-readable site name, used in <title> templates and structured data. */
  siteName: z.string().min(1),

  /**
   * Production domain, no protocol, e.g. "example.com". Used to build canonical
   * URLs. Set to `null` when a domain hasn't been purchased/assigned yet — see
   * resolveOrigin()/isProductionReady() below for what happens in that state.
   */
  domain: z
    .string()
    .regex(domainPattern, "domain must be a bare hostname, e.g. 'example.com'")
    .nullable(),

  /** Legal/organization name shown on the privacy policy and in structured data. */
  organizationName: z.string().min(1),

  /** Fallback meta description used when a page doesn't define its own. */
  defaultDescription: z.string().min(1).max(300),

  /** Default Open Graph image, relative to the site's public/ dir, e.g. "/og-default.png". */
  defaultOgImage: z.string().startsWith("/"),

  /** BCP 47 locale, e.g. "en-US". */
  locale: z.string().default("en-US"),

  /** Theme color for the browser UI / PWA meta tag, e.g. "#1d4ed8". */
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),

  /** Contact email shown on the privacy policy placeholder. Must be reviewed before launch. */
  contactEmail: z.string().email(),

  analytics: z.object({
    /**
     * GA4 measurement ID. Leave as GA4_PLACEHOLDER_ID to disable analytics entirely.
     *
     * The format is enforced because this value is set from an environment
     * variable and is interpolated into an inline <script> by Astro's
     * define:vars. Constraining it to GA4's own shape means a typo fails the
     * build loudly instead of silently breaking analytics, and no string that
     * could terminate a script tag can ever reach that sink.
     */
    ga4MeasurementId: z
      .string()
      .regex(
        /^(G-[A-Z0-9]{4,20}|G-PLACEHOLDER)$/,
        'GA4 measurement ID must look like "G-XXXXXXXXXX" (or the placeholder).'
      )
      .default(GA4_PLACEHOLDER_ID),
  }),

  ads: z
    .object({
      /** Master switch. Must be explicitly set true once an ad network is approved and wired up. */
      enabled: z.boolean().default(false),
      /** e.g. "adsense". Only informational until enabled is true. */
      provider: z.string().optional(),
      /**
       * AdSense publisher id, e.g. "ca-pub-1234567890123456". Setting it alone
       * (ads still disabled) emits the site-verification meta tag and a real
       * /ads.txt, which is what AdSense review needs. Format-checked because
       * it arrives via an environment variable and lands in markup.
       */
      clientId: z
        .string()
        .regex(/^ca-pub-\d{10,20}$/, 'AdSense client ID must look like "ca-pub-1234567890123456".')
        .optional(),
      /**
       * Numeric AdSense ad-unit id for the in-content slot on each page. One
       * unit can be reused across pages. Leave unset to rely on Auto ads.
       */
      inContentSlotId: z
        .string()
        .regex(/^\d{6,20}$/, "AdSense slot ID must be the numeric ad-unit ID, e.g. \"1234567890\".")
        .optional(),
    })
    .refine((ads) => !ads.enabled || Boolean(ads.clientId), {
      message: "ads.enabled is true but no ads.clientId is set.",
      path: ["clientId"],
    }),

  social: z
    .object({
      twitter: z.string().optional(),
    })
    .default({}),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;

/**
 * Validates a site config object and throws a readable error listing every
 * missing/invalid field. Call this from astro.config.mjs so a bad config
 * fails the build immediately instead of producing a broken deploy.
 */
export function validateSiteConfig(input: unknown): SiteConfig {
  const result = siteConfigSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid site configuration. Fix the following and rebuild:\n${issues}`
    );
  }
  return result.data;
}

export const LOCAL_DEV_ORIGIN = "http://localhost:4321";

/** True once a real production domain has been configured. */
export function isProductionReady(config: SiteConfig): boolean {
  return config.domain !== null;
}

/**
 * Resolves the absolute origin to build URLs against, in priority order:
 *   1. The real production domain, once configured.
 *   2. The Cloudflare Pages preview/deploy URL (CF_PAGES_URL is set
 *      automatically by Cloudflare Pages for every build, including
 *      previews — no setup needed).
 *   3. A safe localhost placeholder for local dev.
 * This is never a made-up permanent-looking domain, so nothing here can be
 * mistaken for a real canonical URL before one actually exists.
 */
export function resolveOrigin(config: SiteConfig): string {
  if (config.domain) {
    return `https://${config.domain}`;
  }
  const cfPagesUrl = typeof process !== "undefined" ? process.env.CF_PAGES_URL : undefined;
  if (cfPagesUrl) {
    return cfPagesUrl.replace(/\/$/, "");
  }
  return LOCAL_DEV_ORIGIN;
}

export function canonicalUrl(config: SiteConfig, path: string = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // The root keeps its trailing slash so canonical tags match the sitemap's
  // "https://domain/" form exactly; every other path has none, matching
  // Astro's trailingSlash: "never".
  return `${resolveOrigin(config)}${normalizedPath}`;
}

export function isAnalyticsEnabled(config: SiteConfig): boolean {
  return config.analytics.ga4MeasurementId !== GA4_PLACEHOLDER_ID && config.analytics.ga4MeasurementId.trim() !== "";
}

/** True when ads should actually be served: switched on and a publisher id set. */
export function isAdsActive(config: SiteConfig): boolean {
  return config.ads.enabled && Boolean(config.ads.clientId);
}

/**
 * Body of /ads.txt. With a publisher id it authorizes Google as a direct
 * seller (f08c47fec0942fa0 is Google's fixed certification authority id);
 * without one it is a comment-only file, which the ads.txt spec allows.
 */
export function buildAdsTxt(config: SiteConfig): string {
  if (!config.ads.clientId) {
    return "# No ad networks are authorized for this site yet.\n";
  }
  const publisherId = config.ads.clientId.replace(/^ca-/, "");
  return `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
}

/** The organizationName shipped in site templates, before a real one is set. */
export const PLACEHOLDER_ORGANIZATION_NAME = "Your Company Name";

/**
 * True while organizationName is still the template placeholder. Sites use
 * this to avoid presenting an invented business identity as real — in the
 * footer copyright, and in Organization structured data.
 */
export function hasPlaceholderOrganization(config: SiteConfig): boolean {
  return config.organizationName.trim() === PLACEHOLDER_ORGANIZATION_NAME;
}

/**
 * True when contactEmail uses a domain reserved by RFC 2606/6761
 * (example.com/net/org, .test, .invalid, .example). Those can never receive
 * mail, so the address must never be rendered as a working contact.
 */
export function hasPlaceholderContactEmail(config: SiteConfig): boolean {
  const domain = config.contactEmail.trim().toLowerCase().split("@")[1] ?? "";
  const reservedDomains = ["example.com", "example.net", "example.org", "example.edu"];
  const reservedTlds = [".test", ".invalid", ".example", ".localhost"];
  return (
    reservedDomains.includes(domain) || reservedTlds.some((tld) => domain.endsWith(tld))
  );
}
