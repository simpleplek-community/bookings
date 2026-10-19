import { NextRequest, NextResponse } from "next/server";
import { createEstimate, updateEstimate, getEstimate, getProperty, getUserProfile, isUserAdmin } from "@/lib/firebase";
import { getSessionUser, viewerRoleFor, canManageStay, unauthorized, forbidden } from "@/lib/auth";
import { quoteStayForRequest } from "@/lib/stay-quote";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) return unauthorized("Please sign in to request an estimate.");

    const body = await request.json().catch(() => ({}));
    const customerId = session.uid;
    const customerEmail = session.email || body.customerEmail;
    const {
      propertyId,
      packageId,
      customerName,
      fromDate,
      toDate
    } = body;

    // Validation
    if (!propertyId || !customerName || !customerEmail || !customerId || !fromDate || !toDate) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    const property = await getProperty(propertyId);
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    // Verify Pro property booking entitlement
    if (property.isPro) {
      const isOwner = Boolean(property.hostId && customerId && property.hostId === customerId);
      const profile = customerId ? await getUserProfile(customerId) : null;
      const isAdmin = await isUserAdmin(session.uid, session.email, session.emailVerified);
      const isPro = profile?.plan === "pro" || isAdmin || isOwner;
      if (!isPro) {
        return NextResponse.json({
          success: false,
          error: "This property is exclusively available to Pro members. Upgrade to Pro to reserve.",
          isPro: true
        }, { status: 403 });
      }
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ success: false, error: "Invalid check-in or check-out date." }, { status: 400 });
    }

    // The total is always priced here; any client-sent total is ignored.
    const priced = await quoteStayForRequest(session, property, start, end, packageId);
    if (!priced.ok) {
      return NextResponse.json({ success: false, error: priced.error }, { status: priced.status });
    }

    const estimate = await createEstimate({
      propertyId,
      packageId: priced.packageId,
      customerName,
      customerEmail,
      customerId,
      fromDate: start.toISOString(),
      toDate: end.toISOString(),
      total: priced.quote.total,
      // Guests are only ever added through the invite link, using their verified session.
      guests: [],
      guestsDetails: {}
    });

    return NextResponse.json({ success: true, estimate }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/estimates error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { estimateId, packageId } = body;

    if (!estimateId) {
      return NextResponse.json({ success: false, error: "estimateId is required." }, { status: 400 });
    }

    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const existing = await getEstimate(estimateId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Estimate not found." }, { status: 404 });
    }
    const property = await getProperty(existing.propertyId);
    const role = viewerRoleFor(session, existing, property);
    if (!role) {
      return forbidden("You are not part of this estimate.");
    }
    if (!canManageStay(role)) {
      return forbidden("Only the organiser can change the package. Guests have read-only access.");
    }
    if (existing.paymentStatus === "paid") {
      return NextResponse.json({ success: false, error: "This estimate has already been paid." }, { status: 409 });
    }
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    // Reprice from the stored stay dates; any client-sent total is ignored.
    const priced = await quoteStayForRequest(session, property, existing.fromDate, existing.toDate, packageId);
    if (!priced.ok) {
      return NextResponse.json({ success: false, error: priced.error }, { status: priced.status });
    }

    const updated = await updateEstimate(estimateId, {
      packageId: priced.packageId,
      total: priced.quote.total
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Estimate not found or update failed." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Estimate updated successfully.",
      estimate: { ...existing, packageId: priced.packageId, total: priced.quote.total, viewerRole: role }
    });
  } catch (error: any) {
    console.error("PATCH /api/estimates error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
