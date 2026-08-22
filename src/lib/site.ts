/**
 * Canonical origin for metadata, sitemap, and robots.
 *
 * Vercel injects `VERCEL_URL` at build time, so a preview or production
 * deployment resolves itself without hard-coding a domain. Set
 * `NEXT_PUBLIC_SITE_URL` to override (e.g. for a custom domain).
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
