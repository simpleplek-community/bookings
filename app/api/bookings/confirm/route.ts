import { NextRequest, NextResponse } from "next/server";
import { getEstimate, updateEstimateStatus, createBooking, listBookings, getProperty, updateBooking } from "@/lib/firebase";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { getSessionUser, isPaymentsLive, isPartyTo, unauthorized, forbidden } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { estimateId, customerName } = body;

    if (!estimateId) {
      return NextResponse.json({ success: false, error: "estimateId is required." }, { status: 400 });
    }

    const session = await getSessionUser(request);
    if (!session) return unauthorized();

    const estimate = await getEstimate(estimateId);
    if (!estimate) {
      return NextResponse.json({ success: false, error: "Estimate not found." }, { status: 404 });
    }
    if (!isPartyTo(session, estimate)) {
      return forbidden("You are not part of this estimate.");
    }

    // With live payments the client redirect proves nothing; the signed Yoco webhook marks
    // bookings as paid. This route then only reports what the webhook already recorded.
    const live = isPaymentsLive();
    const paymentStatus = live ? undefined : body.paymentStatus;
    const customerId = session.uid;
    const customerEmail = session.email || undefined;

    const property = await getProperty(estimate.propertyId);
    const isHourly = property?.bookingType === "hourly";

    // Resolve target customer credentials (passed from checkout redirect fallback or fallback to estimate owner)
    const targetEmail = customerEmail || estimate.customerEmail;
    const targetId = customerId || estimate.customerId;
    const targetName = (customerName && customerName !== "Guest") ? customerName : (estimate.customerName || customerName || "Guest");

    // Check if booking already exists for this estimateId & customer
    const existingBookings = await listBookings();
    const existingBooking = existingBookings.find((b: any) => {
      if (isHourly) {
        return b.estimateId === estimateId && (b.customerEmail === targetEmail || b.customerId === targetId);
      } else {
        return b.estimateId === estimateId;
      }
    });

    if (live) {
      if (existingBooking) {
        const { token, ...visible } = existingBooking;
        return NextResponse.json({ success: true, booking: visible, message: "Booking already confirmed." });
      }
      return NextResponse.json({ success: true, pending: true, message: "Payment is being confirmed." }, { status: 202 });
    }

    if (existingBooking) {
      // Sync guests & details from estimate to existing booking
      const mergedGuests = Array.from(new Set([...(existingBooking.guests || []), ...(estimate.guests || [])]));
      const mergedDetails = { ...(estimate.guestsDetails || {}), ...(existingBooking.guestsDetails || {}) };
      const statusToSet = paymentStatus || existingBooking.paymentStatus || "paid";

      await updateBooking(existingBooking.id, {
        paymentStatus: statusToSet,
        guests: mergedGuests,
        guestsDetails: mergedDetails
      });
      existingBooking.paymentStatus = statusToSet;
      existingBooking.guests = mergedGuests;
      existingBooking.guestsDetails = mergedDetails;

      if ((paymentStatus === "paid" || existingBooking.paymentStatus === "paid") && !existingBooking.confirmationEmailSent) {
        console.log(`[confirm route] Existing booking ${existingBooking.id} found without confirmation email. Sending now...`);
        try {
          await sendBookingConfirmationEmail(existingBooking);
        } catch (err) {
          console.error("[confirm route] Error sending confirmation email for existing booking:", err);
        }
      }
      return NextResponse.json({ success: true, booking: existingBooking, message: "Booking already confirmed." });
    }

    // Create the booking
    const booking = await createBooking({
      propertyId: estimate.propertyId,
      packageId: estimate.packageId || null,
      customerName: targetName,
      customerEmail: targetEmail,
      customerId: targetId,
      fromDate: estimate.fromDate,
      toDate: estimate.toDate,
      total: Number(estimate.total),
      paymentStatus: paymentStatus || "paid",
      estimateId: estimate.id,
      guests: estimate.guests || [],
      guestsDetails: estimate.guestsDetails || {}
    } as any);

    // Update estimate status to paid ONLY if nightly stay
    if (!isHourly) {
      await updateEstimateStatus(estimateId, "paid");
    }

    // Trigger email notification with await to prevent premature serverless termination
    try {
      await sendBookingConfirmationEmail(booking);
    } catch (err) {
      console.error("[confirm route] Failed to send sendBookingConfirmationEmail:", err);
    }

    return NextResponse.json({ success: true, booking, message: "Booking confirmed successfully!" }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/bookings/confirm error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
