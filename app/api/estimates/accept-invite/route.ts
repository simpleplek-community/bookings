import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isCustomerOf, unauthorized } from "@/lib/auth";
import { getEstimateByToken, addGuestToEstimate, addGuestToBooking, listBookingsForEstimate } from "@/lib/firebase";
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

    const estimate = await getEstimateByToken(token);
    if (!estimate) {
      return NextResponse.json(
        { success: false, error: "This invite link is invalid or has been replaced by a newer one." },
        { status: 404 }
      );
    }
    if (isInviteExpired(estimate)) {
      return NextResponse.json({ success: false, error: "This estimate invitation has expired." }, { status: 410 });
    }
    if (isCustomerOf(session, estimate)) {
      return NextResponse.json({ success: true, estimateId: estimate.id, alreadyJoined: true });
    }

    const guest = guestFromSession(session);
    const result = await addGuestToEstimate(estimate.id, guest);
    if (!result.ok) return joinFailureResponse(result, "Estimate");

    // Joining an estimate also puts the guest on bookings already created from it.
    // These joins are part of this one explicit action and send no emails of their own.
    try {
      for (const b of await listBookingsForEstimate(estimate.id)) {
        const synced = await addGuestToBooking(b.id, guest);
        if (!synced.ok) console.warn(`Could not add guest to booking ${b.id} linked to estimate ${estimate.id}: ${synced.reason}`);
      }
    } catch (bkErr) {
      console.warn("Failed to sync joined guest to existing booking:", bkErr);
    }

    if (result.added) {
      await sendGuestJoinedEmails({ kind: "estimate", stay: estimate, guest });
    }

    return NextResponse.json({
      success: true,
      estimateId: estimate.id,
      alreadyJoined: !result.added,
      message: result.added ? "Successfully joined the estimate!" : "You are already a guest on this estimate.",
    });
  } catch (error: any) {
    console.error("POST /api/estimates/accept-invite error:", error);
    return NextResponse.json({ success: false, error: "Failed to join estimate." }, { status: 500 });
  }
}
