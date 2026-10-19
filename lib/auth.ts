import { verifyIdToken, isSuperAdmin } from "./firebase";

export interface SessionUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  /** Display name from the verified identity, if the account has one. */
  name: string | null;
  isSuperAdmin: boolean;
}

/**
 * Resolves the caller from a verified Firebase ID token sent as
 * `Authorization: Bearer <idToken>`. Never trust identity passed in headers,
 * query strings or request bodies.
 */
export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  try {
    const decoded = await verifyIdToken(match[1].trim());
    if (!decoded?.uid) return null;
    const email = decoded.email ? String(decoded.email).toLowerCase() : null;
    const emailVerified = Boolean(decoded.email_verified);
    return {
      uid: decoded.uid,
      email,
      emailVerified,
      name: decoded.name ? String(decoded.name) : null,
      isSuperAdmin: isSuperAdmin(email, emailVerified),
    };
  } catch {
    return null;
  }
}

/** True when real Yoco payments are configured, so payment state must come from verified sources only. */
export function isPaymentsLive(): boolean {
  return Boolean(process.env.YOCO_SEC?.trim());
}

/** Whether the session user owns a property (by uid, or by verified email for legacy email-keyed hosts). */
export function ownsProperty(user: SessionUser | null, property: { hostId?: string } | null): boolean {
  if (!user || !property?.hostId) return false;
  const hostId = String(property.hostId).toLowerCase();
  if (user.uid.toLowerCase() === hostId) return true;
  return Boolean(user.emailVerified && user.email && user.email === hostId);
}

type PartyRecord = { customerId?: string; customerEmail?: string; guests?: string[] };

/** Whether the session user is the customer who created a booking/estimate. */
export function isCustomerOf(user: SessionUser | null, record: PartyRecord | null): boolean {
  if (!user || !record) return false;
  if (record.customerId && record.customerId === user.uid) return true;
  return Boolean(
    user.emailVerified && user.email && record.customerEmail && record.customerEmail.toLowerCase() === user.email
  );
}

/** Whether the session user is the customer or a joined guest on a booking/estimate. */
export function isPartyTo(user: SessionUser | null, record: PartyRecord | null): boolean {
  if (!user || !record) return false;
  if (Array.isArray(record.guests) && record.guests.includes(user.uid)) return true;
  return isCustomerOf(user, record);
}

export type ViewerRole = "admin" | "host" | "customer" | "guest";

/**
 * The caller's role on a booking/estimate, or null when they have no access.
 * Admins, the property host and the customer manage the stay (invite link, guest list);
 * joined guests get a read-only view.
 */
export function viewerRoleFor(
  user: SessionUser | null,
  record: PartyRecord | null,
  property: { hostId?: string } | null
): ViewerRole | null {
  if (!user || !record) return null;
  if (user.isSuperAdmin) return "admin";
  if (isCustomerOf(user, record)) return "customer";
  if (ownsProperty(user, property)) return "host";
  if (Array.isArray(record.guests) && record.guests.includes(user.uid)) return "guest";
  return null;
}

export function canManageStay(role: ViewerRole | null): boolean {
  return role === "admin" || role === "host" || role === "customer";
}

/**
 * Shapes a booking/estimate for the viewer. Managers see everything; guests never
 * receive the invite token, the removed-guest list or other guests' emails.
 */
export function scopeStayForViewer<T extends Record<string, any>>(record: T, role: ViewerRole, viewerUid: string) {
  if (canManageStay(role)) return { ...record, viewerRole: role };
  const { token, removedGuests, guestsDetails, confirmationEmailError, ...rest } = record;
  const details: Record<string, { name: string; joinedAt?: string; email?: string }> = {};
  for (const [uid, d] of Object.entries((guestsDetails || {}) as Record<string, any>)) {
    details[uid] = { name: d?.name || "", joinedAt: d?.joinedAt, ...(uid === viewerUid ? { email: d?.email || "" } : {}) };
  }
  return { ...rest, guestsDetails: details, viewerRole: role };
}

export function unauthorized(message = "Authentication required.") {
  return Response.json({ success: false, error: message, data: message }, { status: 401 });
}

export function forbidden(message = "You do not have access to this resource.") {
  return Response.json({ success: false, error: message, data: message }, { status: 403 });
}
