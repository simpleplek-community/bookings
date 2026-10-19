import { NextRequest, NextResponse } from "next/server";
import { removeGuestFromBooking } from "@/lib/firebase";
import { loadStayForRequest } from "@/lib/stay-access";

/** Removes a guest from the booking. Customer, host or admin only. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  try {
    const { id, guestId } = await params;
    const access = await loadStayForRequest(request, "booking", id, { manage: true });
    if (!access.ok) return access.response;
    if (!(access.record.guests || []).includes(guestId)) {
      return NextResponse.json({ success: false, error: "That guest is not on this booking." }, { status: 404 });
    }

    await removeGuestFromBooking(id, guestId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/bookings/[id]/guests/[guestId] error:", error);
    return NextResponse.json({ success: false, error: "Could not remove the guest." }, { status: 500 });
  }
}
