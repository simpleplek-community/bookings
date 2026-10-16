import { NextRequest, NextResponse } from "next/server";
import { getBooking, getProperty } from "@/lib/firebase";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { getSessionUser, isPartyTo, ownsProperty, unauthorized, forbidden } from "@/lib/auth";

async function canAccessBooking(request: NextRequest, booking: any): Promise<Response | null> {
  const session = await getSessionUser(request);
  if (!session) return unauthorized();
  if (session.isSuperAdmin || isPartyTo(session, booking)) return null;
  if (ownsProperty(session, await getProperty(booking.propertyId))) return null;
  return forbidden("You do not have access to this booking.");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await getBooking(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
    }
    const denied = await canAccessBooking(request, booking);
    if (denied) return denied;
    return NextResponse.json({ success: true, data: booking });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("GET /api/bookings/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await getBooking(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found." }, { status: 404 });
    }
    const denied = await canAccessBooking(request, booking);
    if (denied) return denied;

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
