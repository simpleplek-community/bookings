import { NextRequest, NextResponse } from "next/server";
import { createProperty, listProperties, isUserAdmin, getUserProfile, getHostIdBySubdomain } from "@/lib/firebase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hostId = searchParams.get("hostId") || undefined;
    const subdomain = searchParams.get("subdomain") || undefined;
    const viewerId = searchParams.get("userId") || req.headers.get("x-user-id") || undefined;
    const viewerEmail = searchParams.get("email") || req.headers.get("x-user-email") || undefined;

    let resolvedHostId = hostId;

    if (subdomain) {
      const hostFromSub = await getHostIdBySubdomain(subdomain);
      if (hostFromSub) {
        resolvedHostId = hostFromSub;
      } else {
        return NextResponse.json({ success: true, data: [], properties: [] });
      }
    }

    const list = await listProperties(resolvedHostId || undefined);

    // If host is explicitly queried (like admin dashboard) or viewer is owner/admin/pro, return all
    const isExplicitHostQuery = Boolean(hostId && !subdomain);
    const isOwner = Boolean((viewerId && resolvedHostId && viewerId === resolvedHostId) || isExplicitHostQuery);
    
    // Check if viewer is a Pro member or Admin
    let isProViewer = false;
    if (viewerId || viewerEmail) {
      const viewerProfile = viewerId ? await getUserProfile(viewerId) : null;
      const emailToCheck = viewerEmail || viewerProfile?.email || "";
      const isViewerAdmin = await isUserAdmin(viewerId || "", emailToCheck);
      if (viewerProfile?.plan === "pro" || isViewerAdmin) {
        isProViewer = true;
      }
    }

    // Filter list: If not owner, not explicit host query, and not pro viewer, exclude isPro properties from public listing
    const filteredList = isOwner || isProViewer
      ? list
      : list.filter((p: any) => !p.isPro);

    return NextResponse.json({ success: true, data: filteredList, properties: filteredList });
  } catch (err: any) {
    console.error("GET /api/posts error:", err);
    return NextResponse.json({ success: false, error: err.message, data: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const userId = request.headers.get("x-user-id");
    const email = request.headers.get("x-user-email");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized access: authentication required.", data: "Unauthorized access: authentication required." }, { status: 401 });
    }

    // Verify property limit for standard subscription (max 3 properties)
    const profile = await getUserProfile(userId);
    const userPlan = profile?.plan || "standard";
    const isAdmin = await isUserAdmin(userId, email);

    if (userPlan === "standard" && !isAdmin) {
      const existingListings = await listProperties(userId);
      if (existingListings.length >= 3) {
        return NextResponse.json({
          success: false,
          error: "Property limit reached. Standard subscription plan is limited to 3 properties. Upgrade to Pro for unlimited listings.",
          data: "Property limit reached."
        }, { status: 403 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const { hostId, name, title, slug, basePricePerNight, description, images, airbnbCalendarUrl, googleCalendarUrl, bookingType, slots, location, weeklyDiscount, monthlyDiscount, mandatoryRules, isPro } = body;

    // Verify Pro property creation entitlement
    if (isPro && userPlan === "standard" && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: "Pro-only properties require a Pro subscription plan. Please upgrade to Pro to publish Pro-exclusive listings.",
        data: "Pro entitlement required."
      }, { status: 403 });
    }

    // Use passed hostId or fallback to headers
    const activeHostId = hostId || userId;

    if (!activeHostId) {
      return NextResponse.json({ success: false, error: "Missing identity metadata parameters (hostId)", data: "Missing identity metadata parameters (hostId)" }, { status: 400 });
    }

    const resolvedTitle = title || name;
    if (!resolvedTitle || !slug || basePricePerNight === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields (title/name, slug, basePricePerNight)", data: "Missing required fields (title/name, slug, basePricePerNight)" }, { status: 400 });
    }

    const price = Number(basePricePerNight);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ success: false, error: "basePricePerNight must be a positive number", data: "basePricePerNight must be a positive number" }, { status: 400 });
    }

    const property = await createProperty({
      title: resolvedTitle,
      name: resolvedTitle,
      slug: slug.trim().toLowerCase(),
      basePricePerNight: price,
      airbnbCalendarUrl: airbnbCalendarUrl || "",
      googleCalendarUrl: googleCalendarUrl || "",
      hostId: activeHostId,
      description: description || "",
      images: images || [],
      bookingType: bookingType || "nightly",
      slots: slots || [],
      location: location || "",
      weeklyDiscount: weeklyDiscount !== undefined ? Number(weeklyDiscount) : undefined,
      monthlyDiscount: monthlyDiscount !== undefined ? Number(monthlyDiscount) : undefined,
      mandatoryRules: mandatoryRules || [],
      isPro: Boolean(isPro)
    });

    return NextResponse.json({ success: true, data: property, id: property.id }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/posts error:", err);
    return NextResponse.json({ success: false, error: err.message, data: err.message }, { status: 500 });
  }
}
