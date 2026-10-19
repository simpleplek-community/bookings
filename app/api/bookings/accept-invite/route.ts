import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isCustomerOf, unauthorized } from "@/lib/auth";
import { getBookingByToken, addGuestToBooking } from "@/lib/firebase";
import { sendGuestJoinedEmails } from "@/lib/email";
import { guestFromSession, isInviteExpired, joinFailureResponse } from "@/lib/invites";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const { token } = await request.json().catch(() => ({}));

    if (!token) {
      return NextResponse.json({ success: false, error: "Missing required field (token)" }, { status: 400 });
    }

    const booking = await getBookingByToken(token);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "This invite link is invalid or has been replaced by a newer one." },
        { status: 404 }
      );
    }
    if (isInviteExpired(booking)) {
      return NextResponse.json({ success: false, error: "This booking invitation has expired." }, { status: 410 });
    }
    if (isCustomerOf(session, booking)) {
      return NextResponse.json({ success: true, bookingId: booking.id, alreadyJoined: true });
    }

    const guest = guestFromSession(session);
    const result = await addGuestToBooking(booking.id, guest);
    if (!result.ok) return joinFailureResponse(result, "Booking");

    if (result.added) {
      // Email failures are logged inside and never fail the join.
      await sendGuestJoinedEmails({ kind: "booking", stay: booking, guest });
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      alreadyJoined: !result.added,
      message: result.added ? "Successfully joined the booking!" : "You are already a guest on this booking.",
    });
  } catch (error: any) {
    console.error("POST /api/bookings/accept-invite error:", error);
    return NextResponse.json({ success: false, error: "Failed to join booking." }, { status: 500 });
  }
}
