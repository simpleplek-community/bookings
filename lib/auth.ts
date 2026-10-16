import { verifyIdToken, isSuperAdmin } from "./firebase";

export interface SessionUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
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

/** Whether the session user is the customer or a joined guest on a booking/estimate. */
export function isPartyTo(
  user: SessionUser | null,
  record: { customerId?: string; customerEmail?: string; guests?: string[] } | null
): boolean {
  if (!user || !record) return false;
  if (record.customerId && record.customerId === user.uid) return true;
  if (Array.isArray(record.guests) && record.guests.includes(user.uid)) return true;
  return Boolean(
    user.emailVerified && user.email && record.customerEmail && record.customerEmail.toLowerCase() === user.email
  );
}

export function unauthorized(message = "Authentication required.") {
  return Response.json({ success: false, error: message, data: message }, { status: 401 });
}

export function forbidden(message = "You do not have access to this resource.") {
  return Response.json({ success: false, error: message, data: message }, { status: 403 });
}
