/**
 * Deployment platform hostnames that must never be used as subdomain bases.
 * Subdomains like {slug}.vercel.app don't exist — they cause ERR_CONNECTION_CLOSED.
 * When CLIENT_PORTAL_BASE_URL is set to one of these, fall back to path-based routing.
 */
const PLATFORM_SUFFIXES = [
  ".vercel.app",
  ".railway.app",
  ".up.railway.app",
  ".onrender.com",
  ".netlify.app",
  ".fly.dev",
  ".herokuapp.com",
  ".pages.dev",
  ".replit.app",
  ".repl.co",
  ".replit.dev",
];

function isDeploymentPlatformDomain(host: string): boolean {
  const h = host.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  return PLATFORM_SUFFIXES.some((suffix) => h.endsWith(suffix));
}

/**
 * Resolves whether subdomain-based portal routing is actually usable.
 * Returns true only when CLIENT_PORTAL_BASE_URL is set AND is a real custom
 * domain (not a hosting platform URL like *.vercel.app).
 */
function useSubdomainRouting(): boolean {
  const base = process.env.CLIENT_PORTAL_BASE_URL;
  if (!base) return false;
  return !isDeploymentPlatformDomain(base);
}

/**
 * Builds the magic-link URL for a client invitation email.
 */
export function buildMagicLinkUrl(slug: string, token: string): string {
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/portal/${slug}/auth/magic?token=${token}`;
  }
  if (useSubdomainRouting()) {
    const base = process.env.CLIENT_PORTAL_BASE_URL!
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    return `https://${slug}.${base}/auth/magic?token=${token}`;
  }
  const base = (process.env.FRONTEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${base}/portal/${slug}/auth/magic?token=${token}`;
}

/**
 * Builds a generic portal deep-link (reports, messages, etc.).
 */
export function buildPortalUrl(slug: string, path: string): string {
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/portal/${slug}/${path}`;
  }
  if (useSubdomainRouting()) {
    const base = process.env.CLIENT_PORTAL_BASE_URL!
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    return `https://${slug}.${base}/${path}`;
  }
  const base = (process.env.FRONTEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${base}/portal/${slug}/${path}`;
}
