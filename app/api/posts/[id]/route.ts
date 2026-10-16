import { NextRequest, NextResponse } from "next/server";
import { getProperty, createProperty, deleteProperty, isUserAdmin, getUserProfile } from "@/lib/firebase";
import { getSessionUser, ownsProperty, unauthorized, forbidden } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const session = await getSessionUser(request);

    const property = await getProperty(id);
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    if (property.isPro) {
      // Check if viewer is owner, admin, or pro member
      let isProViewer = false;
      const isOwner = ownsProperty(session, property);

      if (session) {
        const viewerProfile = await getUserProfile(session.uid);
        const isViewerAdmin = await isUserAdmin(session.uid, session.email, session.emailVerified);
        if (viewerProfile?.plan === "pro" || isViewerAdmin) {
          isProViewer = true;
        }
      }

      if (!isOwner && !isProViewer) {
        return NextResponse.json({
          success: false,
          error: "This listing is exclusively available to Pro members. Upgrade to Pro to view.",
          isPro: true
        }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: property });
  } catch (err: any) {
    console.error("GET /api/posts/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const userId = session.uid;

    // Retrieve existing property to verify ownership
    const existing = await getProperty(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    // Only the listing's host or a platform operator may edit it
    if (!ownsProperty(session, existing) && !session.isSuperAdmin) {
      return forbidden("Unauthorized: You do not own this property listing.");
    }

    const body = await request.json().catch(() => ({}));
    const { title, name, slug, basePricePerNight, airbnbCalendarUrl, googleCalendarUrl, description, images, bookingType, slots, location, weeklyDiscount, monthlyDiscount, mandatoryRules, isPro } = body;

    // Check Pro entitlement if setting isPro to true
    if (isPro) {
      const profile = await getUserProfile(userId);
      const userPlan = profile?.plan || "standard";
      const isAdmin = await isUserAdmin(userId, session.email, session.emailVerified);
      if (userPlan === "standard" && !isAdmin) {
        return NextResponse.json({
          success: false,
          error: "Pro-only properties require a Pro subscription plan. Please upgrade to Pro to publish Pro-exclusive listings.",
          data: "Pro entitlement required."
        }, { status: 403 });
      }
    }

    const resolvedTitle = title || name;
    if (!resolvedTitle || !slug || basePricePerNight === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields (title/name, slug, basePricePerNight)" }, { status: 400 });
    }

    const price = Number(basePricePerNight);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ success: false, error: "basePricePerNight must be a positive number" }, { status: 400 });
    }

    // Call createProperty passing the id to ensure overwrite/update rather than duplicate
    const property = await createProperty({
      id,
      title: resolvedTitle,
      name: resolvedTitle,
      slug: slug.trim().toLowerCase(),
      basePricePerNight: price,
      airbnbCalendarUrl: airbnbCalendarUrl || "",
      googleCalendarUrl: googleCalendarUrl || "",
      hostId: existing.hostId || userId, // Keep original hostId if set
      description: description !== undefined ? description : (existing.description || ""),
      images: images !== undefined ? images : (existing.images || []),
      bookingType: bookingType !== undefined ? bookingType : (existing.bookingType || "nightly"),
      slots: slots !== undefined ? slots : (existing.slots || []),
      location: location !== undefined ? location : (existing.location || ""),
      weeklyDiscount: weeklyDiscount !== undefined ? Number(weeklyDiscount) : (existing.weeklyDiscount || 0),
      monthlyDiscount: monthlyDiscount !== undefined ? Number(monthlyDiscount) : (existing.monthlyDiscount || 0),
      mandatoryRules: mandatoryRules !== undefined ? mandatoryRules : (existing.mandatoryRules || []),
      isPro: isPro !== undefined ? Boolean(isPro) : Boolean(existing.isPro)
    });

    return NextResponse.json({ success: true, data: property });
  } catch (err: any) {
    console.error("PUT /api/posts/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getSessionUser(request);
    if (!session) return unauthorized();

    // Retrieve existing property to verify ownership
    const existing = await getProperty(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    // Only the listing's host or a platform operator may delete it
    if (!ownsProperty(session, existing) && !session.isSuperAdmin) {
      return forbidden("Unauthorized: You do not own this property listing.");
    }

    const success = await deleteProperty(id);
    if (!success) {
      return NextResponse.json({ success: false, error: "Property not found or delete failed." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: "Property deleted successfully." });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
