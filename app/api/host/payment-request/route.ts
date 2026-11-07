import { NextRequest, NextResponse } from "next/server";
import { getProperty, getPackage, getBooking, updateBooking, getUserProfile } from "@/lib/firebase";
import { sendOutstandingPackagePaymentRequestEmail } from "@/lib/email";
import { getSessionUser, ownsProperty, unauthorized, forbidden } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return unauthorized("You must be signed in to send payment requests.");
    }

    const body = await request.json().catch(() => ({}));
    const { propertyId, packageId, bookingId, customerEmail, customerName, note } = body;

    if (!propertyId || !packageId) {
      return NextResponse.json(
        { success: false, error: "propertyId and packageId are required." },
        { status: 400 }
      );
    }

    if (!customerEmail || !customerEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid customer email is required." },
        { status: 400 }
      );
    }

    // Verify property ownership
    const property = await getProperty(propertyId);
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    if (!session.isSuperAdmin && !ownsProperty(session, property)) {
      return forbidden("You can only send payment requests for properties you own.");
    }

    // Verify package exists
    const pkg = await getPackage(packageId);
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package not found." }, { status: 404 });
    }

    // Verify booking if provided
    let booking = null;
    let isCompleted = false;
    if (bookingId) {
      booking = await getBooking(bookingId);
      if (booking && booking.toDate) {
        isCompleted = new Date(booking.toDate).getTime() < Date.now();
      }
    }

    // Resolve siteUrl and paymentUrl
    const host = request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const siteUrl = host ? `${proto}://${host}` : request.nextUrl.origin;

    // Use host profile subdomain if available
    let hostSubdomain: string | undefined;
    try {
      const hostProfile = property.hostId ? await getUserProfile(property.hostId) : null;
      hostSubdomain = hostProfile?.subdomain;
    } catch {}

    const baseOrigin = hostSubdomain
      ? `https://${hostSubdomain}.simpleplek.co.za`
      : siteUrl;

    const paymentUrl = bookingId
      ? `${baseOrigin}/bookings/${encodeURIComponent(bookingId)}?intent=addon&addonId=${encodeURIComponent(pkg.id)}`
      : `${baseOrigin}/bookings?propertyId=${encodeURIComponent(propertyId)}&packageId=${encodeURIComponent(pkg.id)}`;

    const resolvedCustomerName =
      customerName ||
      booking?.customerName ||
      customerEmail.split("@")[0];

    const hostName = session.name || session.email?.split("@")[0] || "Host";

    const sent = await sendOutstandingPackagePaymentRequestEmail({
      customerEmail,
      customerName: resolvedCustomerName,
      propertyTitle: property.title || "Stay",
      propertyLocation: property.location,
      bookingId: bookingId || undefined,
      fromDate: booking?.fromDate,
      toDate: booking?.toDate,
      isCompleted,
      packageName: pkg.name || pkg.title || "Package",
      packageDescription: pkg.description,
      packageCategory: pkg.category,
      amountZar: Number(pkg.price || 0),
      hostName,
      hostEmail: session.email || undefined,
      paymentUrl,
      note: typeof note === "string" ? note.trim() : undefined,
    });

    if (!sent) {
      return NextResponse.json(
        { success: false, error: "Failed to send email. Check email delivery configuration." },
        { status: 502 }
      );
    }

    // Record payment request log on the booking if applicable
    if (bookingId && booking) {
      const existingRequests = Array.isArray(booking.paymentRequests) ? booking.paymentRequests : [];
      const newRequestEntry = {
        id: `pr_${Date.now()}`,
        sentAt: new Date().toISOString(),
        packageId: pkg.id,
        packageName: pkg.name || pkg.title,
        amount: Number(pkg.price || 0),
        recipientEmail: customerEmail,
        recipientName: resolvedCustomerName,
        note: note || "",
        sentBy: session.uid,
      };

      await updateBooking(bookingId, {
        paymentRequests: [...existingRequests, newRequestEntry],
        lastPaymentRequestSentAt: new Date().toISOString(),
      }).catch((err) => console.warn("[PaymentRequest] Could not log request to booking:", err));
    }

    return NextResponse.json({
      success: true,
      message: `Payment request email sent to ${customerEmail} for R ${Number(pkg.price || 0).toLocaleString()}.`,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("POST /api/host/payment-request error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
