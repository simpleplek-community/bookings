import { NextRequest, NextResponse } from "next/server";
import { getProperty, createProperty, deleteProperty, isUserAdmin, getUserProfile } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const viewerId = searchParams.get("userId") || request.headers.get("x-user-id") || undefined;
    const viewerEmail = searchParams.get("email") || request.headers.get("x-user-email") || undefined;

    const property = await getProperty(id);
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    if (property.isPro) {
      // Check if viewer is owner, admin, or pro member
      let isProViewer = false;
      let isOwner = false;

      if (viewerId || viewerEmail) {
        const viewerProfile = viewerId ? await getUserProfile(viewerId) : null;
        const emailToCheck = viewerEmail || viewerProfile?.email || "";
        const isViewerAdmin = await isUserAdmin(viewerId || "", emailToCheck);

        if (viewerProfile?.plan === "pro" || isViewerAdmin) {
          isProViewer = true;
        }

        if (property.hostId) {
          const hostIdStr = String(property.hostId).toLowerCase();
          if (
            (viewerId && String(viewerId).toLowerCase() === hostIdStr) ||
            (emailToCheck && emailToCheck.toLowerCase() === hostIdStr) ||
            (viewerEmail && viewerEmail.toLowerCase() === hostIdStr)
          ) {
            isOwner = true;
          }
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

    // Check admin/host permissions
    const userId = request.headers.get("x-user-id");
    const email = request.headers.get("x-user-email");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized access: authentication required." }, { status: 401 });
    }

    // Retrieve existing property to verify ownership
    const existing = await getProperty(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const isAdmin = await isUserAdmin(userId, email);
    // Verify host tenancy ownership (allow if matching hostId, or if admin, or if existing has no hostId, or if it is default host)
    const propertyHostId = existing.hostId || "mock_admin_example_com";
    const isOwner = Boolean(
      (userId && (userId === propertyHostId || userId.toLowerCase() === propertyHostId.toLowerCase())) ||
      (email && email.toLowerCase() === propertyHostId.toLowerCase()) ||
      propertyHostId === "mock_admin_example_com"
    );

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized: You do not own this property listing." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { title, name, slug, basePricePerNight, airbnbCalendarUrl, googleCalendarUrl, description, images, bookingType, slots, location, weeklyDiscount, monthlyDiscount, mandatoryRules, isPro } = body;

    // Check Pro entitlement if setting isPro to true
    if (isPro) {
      const profile = await getUserProfile(userId);
      const userPlan = profile?.plan || "standard";
      const isAdmin = await isUserAdmin(userId, email);
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

    // Check admin/host permissions
    const userId = request.headers.get("x-user-id");
    const email = request.headers.get("x-user-email");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized access: authentication required." }, { status: 401 });
    }

    // Retrieve existing property to verify ownership
    const existing = await getProperty(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }

    const isAdmin = await isUserAdmin(userId, email);
    // Verify host tenancy ownership
    const propertyHostId = existing.hostId || "mock_admin_example_com";
    const isOwner = Boolean(
      (userId && (userId === propertyHostId || userId.toLowerCase() === propertyHostId.toLowerCase())) ||
      (email && email.toLowerCase() === propertyHostId.toLowerCase()) ||
      propertyHostId === "mock_admin_example_com"
    );
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized: You do not own this property listing." }, { status: 403 });
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
