import { NextRequest, NextResponse } from "next/server";
import { rotateBookingToken } from "@/lib/firebase";
import { loadStayForRequest } from "@/lib/stay-access";

/** Replaces the invite token. The old link stops working immediately. Customer, host or admin only. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await loadStayForRequest(request, "booking", id, { manage: true });
    if (!access.ok) return access.response;

    const token = await rotateBookingToken(id);
    if (!token) {
      return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    console.error("POST /api/bookings/[id]/invite error:", error);
    return NextResponse.json({ success: false, error: "Could not refresh the invite link." }, { status: 500 });
  }
}
