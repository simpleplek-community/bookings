import { getBooking, getEstimate, getProperty } from "./firebase";
import { getSessionUser, viewerRoleFor, canManageStay, unauthorized, forbidden, type SessionUser, type ViewerRole } from "./auth";

export type StayKind = "booking" | "estimate";

type StayAccess =
  | { ok: true; session: SessionUser; record: any; role: ViewerRole }
  | { ok: false; response: Response };

/**
 * Loads a booking/estimate and the caller's role on it. With `manage`, only the
 * customer, the property host or an admin get through; guests get 403.
 */
export async function loadStayForRequest(
  request: Request,
  kind: StayKind,
  id: string,
  { manage = false }: { manage?: boolean } = {}
): Promise<StayAccess> {
  const session = await getSessionUser(request);
  if (!session) return { ok: false, response: unauthorized() };

  const record = kind === "booking" ? await getBooking(id) : await getEstimate(id);
  const noun = kind === "booking" ? "Booking" : "Estimate";
  if (!record) {
    return { ok: false, response: Response.json({ success: false, error: `${noun} not found.` }, { status: 404 }) };
  }

  const property = await getProperty(record.propertyId).catch(() => null);
  const role = viewerRoleFor(session, record, property);
  if (!role) return { ok: false, response: forbidden(`You do not have access to this ${noun.toLowerCase()}.`) };
  if (manage && !canManageStay(role)) {
    return { ok: false, response: forbidden(`Only the organiser or the host can do this. Guests have read-only access.`) };
  }
  return { ok: true, session, record, role };
}
