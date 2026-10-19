import { NextRequest, NextResponse } from "next/server";
import { listBookingsForEstimate, removeGuestFromBooking, removeGuestFromEstimate } from "@/lib/firebase";
import { loadStayForRequest } from "@/lib/stay-access";

/**
 * Removes a guest from the estimate and from bookings created from it, since joining
 * the estimate added them there too. Customer, host or admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  try {
    const { id, guestId } = await params;
    const access = await loadStayForRequest(request, "estimate", id, { manage: true });
    if (!access.ok) return access.response;
    if (!(access.record.guests || []).includes(guestId)) {
      return NextResponse.json({ success: false, error: "That guest is not on this estimate." }, { status: 404 });
    }

    await removeGuestFromEstimate(id, guestId);
    for (const b of await listBookingsForEstimate(id)) {
      if ((b.guests || []).includes(guestId)) await removeGuestFromBooking(b.id, guestId);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/estimates/[id]/guests/[guestId] error:", error);
    return NextResponse.json({ success: false, error: "Could not remove the guest." }, { status: 500 });
  }
}
