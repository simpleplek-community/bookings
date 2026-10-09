import { takenSubdomains } from "../data/takenSubdomains";

export const ROOT_DOMAIN = "simpleplek.co.za";
export const MAX_SUBDOMAIN_LENGTH = 30;

export function sanitizeSubdomain(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, MAX_SUBDOMAIN_LENGTH);
}

export function validateSubdomain(value: string): string | null {
  if (value.length === 0) return "Choose an address for your page.";
  if (value.length < 3) return "Use at least 3 characters.";
  if (value.startsWith("-") || value.endsWith("-")) {
    return "Can't start or end with a hyphen.";
  }
  return null;
}

export function isSubdomainTaken(value: string): boolean {
  return takenSubdomains.includes(value.toLowerCase().trim());
}

export function suggestSubdomains(value: string): string[] {
  const clean = sanitizeSubdomain(value);
  return [`${clean}-stays`, `stay-${clean}`, `${clean}-za`, `${clean}-2`]
    .filter((c) => c.length <= MAX_SUBDOMAIN_LENGTH && !isSubdomainTaken(c))
    .slice(0, 3);
}

export function publicUrl(subdomain: string): string {
  if (typeof window !== "undefined") {
    const host = window.location.host;
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      const baseHost = host.replace(/^[a-z0-9-]+\.(localhost:3000|127\.0\.0\.1:3000)/i, "$1");
      return `${window.location.protocol}//${subdomain}.${baseHost}`;
    }
  }
  return `https://${subdomain}.${ROOT_DOMAIN}`;
}

export function publicHost(subdomain: string): string {
  if (typeof window !== "undefined") {
    const host = window.location.host;
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
      const baseHost = host.replace(/^[a-z0-9-]+\.(localhost:3000|127\.0\.0\.1:3000)/i, "$1");
      return `${subdomain}.${baseHost}`;
    }
  }
  return `${subdomain}.${ROOT_DOMAIN}`;
}
