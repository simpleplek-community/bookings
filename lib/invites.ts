import { getBookingByToken, getEstimateByToken, getProperty, type AddGuestResult, type StayGuest } from "./firebase";
import { isCustomerOf, type SessionUser } from "./auth";

export type InviteKind = "booking" | "estimate";

export interface ResolvedInvite {
  kind: InviteKind;
  record: any;
}

/** Looks up an invite token on estimates first, then bookings. */
export async function resolveInvite(token: unknown): Promise<ResolvedInvite | null> {
  if (typeof token !== "string" || !token) return null;
  const estimate = await getEstimateByToken(token);
  if (estimate) return { kind: "estimate", record: estimate };
  const booking = await getBookingByToken(token);
  if (booking) return { kind: "booking", record: booking };
  return null;
}

/** Invite links stop working once the stay has ended. */
export function isInviteExpired(record: { toDate?: string }): boolean {
  if (!record.toDate) return false;
  const end = new Date(record.toDate).getTime();
  return !isNaN(end) && end < Date.now();
}

/** The joining guest, taken only from the verified session. */
export function guestFromSession(session: SessionUser): StayGuest {
  const email = session.email || "";
  return {
    uid: session.uid,
    email,
    name: (session.name || email.split("@")[0] || "Guest").slice(0, 80),
  };
}

/** What the invite landing page shows before the user chooses to join. */
export async function invitePreview(invite: ResolvedInvite, session: SessionUser) {
  const { kind, record } = invite;
  const property = await getProperty(record.propertyId).catch(() => null);
  return {
    kind,
    id: record.id,
    propertyTitle: property?.title || "Stay",
    propertyImage: property?.images?.[0] || null,
    organiserName: record.customerName || "The organiser",
    fromDate: record.fromDate,
    toDate: record.toDate,
    guestCount: Array.isArray(record.guests) ? record.guests.length : 0,
    expired: isInviteExpired(record),
    isOrganiser: isCustomerOf(session, record),
    alreadyJoined: Array.isArray(record.guests) && record.guests.includes(session.uid),
    removed: Array.isArray(record.removedGuests) && record.removedGuests.includes(session.uid),
  };
}

export function joinFailureResponse(result: Extract<AddGuestResult, { ok: false }>, noun: string) {
  const map = {
    not_found: [404, `${noun} not found.`],
    full: [409, `This ${noun.toLowerCase()} already has the maximum number of guests.`],
    removed: [403, `The organiser removed you from this ${noun.toLowerCase()}.`],
    error: [500, `Failed to join ${noun.toLowerCase()}.`],
  } as const;
  const [status, error] = map[result.reason];
  return Response.json({ success: false, error }, { status });
}
