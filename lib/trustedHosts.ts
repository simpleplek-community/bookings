import { ROOT_DOMAIN } from "@/utils/subdomain";

/**
 * Hosts that may receive login tokens (magic links, cross-subdomain sign-in).
 * A login token sent anywhere else hands that site the user's account.
 *
 * Extra root domains can be added with NEXT_PUBLIC_TRUSTED_ROOT_DOMAINS
 * (comma-separated, e.g. "simpleplek.com,example.org").
 */
export function trustedRootDomains(): string[] {
  const extra = (process.env.NEXT_PUBLIC_TRUSTED_ROOT_DOMAINS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([ROOT_DOMAIN, "simpleplek.com", ...extra]));
}

function isLocalDevHost(hostname: string): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1")
  );
}

export function isTrustedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (isLocalDevHost(host)) return true;
  return trustedRootDomains().some((root) => host === root || host.endsWith(`.${root}`));
}

/** Parses a URL and returns it only if it is http(s) on a trusted host. */
export function trustedUrl(raw: string | null | undefined, alsoTrust: string[] = []): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalDevHost(url.hostname))) {
      return null;
    }
    const host = url.hostname.toLowerCase();
    return isTrustedHostname(host) || alsoTrust.map((h) => h.toLowerCase()).includes(host) ? url : null;
  } catch {
    return null;
  }
}

/** Only allow same-site relative paths for post-login redirects. */
export function safeRelativePath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
