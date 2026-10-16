import { getPackage, getUserProfile, isUserAdmin } from "./firebase";
import { ownsProperty, type SessionUser } from "./auth";
import { isAddonPackage, isProPackage, quoteStay, resolveStayPackageId, stayUnits, type StayQuote } from "./pricing";

export type StayQuoteResult =
  | { ok: true; quote: StayQuote; packageId: string | null }
  | { ok: false; status: number; error: string };

/** Whether the caller may book Pro-only packages for this property. */
export async function canBookPro(session: SessionUser | null, property: { hostId?: string }): Promise<boolean> {
  if (!session) return false;
  if (session.isSuperAdmin || ownsProperty(session, property)) return true;
  const profile = await getUserProfile(session.uid);
  if (profile?.plan === "pro") return true;
  return Boolean(await isUserAdmin(session.uid, session.email, session.emailVerified));
}

/**
 * Prices a stay on the server from the stored property and package. Any total
 * sent by the client is ignored; this is the amount that gets stored and charged.
 */
export async function quoteStayForRequest(
  session: SessionUser | null,
  property: any,
  fromDate: Date | string,
  toDate: Date | string,
  requestedPackageId: string | null | undefined
): Promise<StayQuoteResult> {
  const units = stayUnits(property, fromDate, toDate);
  const isProUser = await canBookPro(session, property);

  // Load the mandatory-rule packages so Pro-only ones can be skipped for non-Pro users.
  const ruleIds = new Set<string>();
  for (const rule of property.mandatoryRules || []) {
    if (Array.isArray(rule.packageIds)) rule.packageIds.forEach((id: string) => ruleIds.add(id));
    if (rule.packageId) ruleIds.add(rule.packageId);
  }
  const rulePackages = (await Promise.all(Array.from(ruleIds).map((id) => getPackage(id)))).filter(Boolean);

  const packageId = resolveStayPackageId(property, units, requestedPackageId, rulePackages, isProUser);

  let pkg: any = null;
  if (packageId) {
    pkg = await getPackage(packageId);
    if (!pkg || (pkg.propertyId !== property.id && pkg.propertyId !== property.slug)) {
      return { ok: false, status: 400, error: "The selected package is not available for this property." };
    }
    if (isAddonPackage(pkg)) {
      return { ok: false, status: 400, error: "Add-ons cannot be booked as a stay package." };
    }
    if (isProPackage(pkg) && !isProUser) {
      return {
        ok: false,
        status: 403,
        error: "This package is exclusively available to Pro subscribers. Upgrade to Pro to book this package.",
      };
    }
  }

  return { ok: true, quote: quoteStay(property, fromDate, toDate, pkg), packageId };
}
