import { NextRequest, NextResponse } from "next/server";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { scopeStayForViewer } from "@/lib/auth";
import { loadStayForRequest } from "@/lib/stay-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await loadStayForRequest(request, "booking", id);
    if (!access.ok) return access.response;
    return NextResponse.json({ success: true, data: scopeStayForViewer(access.record, access.role, access.session.uid) });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("GET /api/bookings/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/** Resends the booking confirmation email. Customer, host or admin only. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await loadStayForRequest(request, "booking", id, { manage: true });
    if (!access.ok) return access.response;
    const booking = access.record;

    const sent = await sendBookingConfirmationEmail(booking);
    if (sent) {
      return NextResponse.json({
        success: true,
        message: `Confirmation email successfully sent to ${booking.customerEmail}`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to deliver confirmation email via email service." },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error("POST /api/bookings/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
