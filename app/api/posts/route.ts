import { NextRequest, NextResponse } from "next/server";
import { createProperty, listProperties, getProperty, isUserAdmin, getUserProfile, getHostIdBySubdomain } from "@/lib/firebase";
import { getSessionUser, ownsProperty, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hostId = searchParams.get("hostId") || undefined;
    const subdomain = searchParams.get("subdomain") || undefined;
    const session = await getSessionUser(req);

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

    // Check if viewer is a Pro member or Admin
    let isProViewer = false;
    if (session) {
      const viewerProfile = await getUserProfile(session.uid);
      const isViewerAdmin = await isUserAdmin(session.uid, session.email, session.emailVerified);
      if (viewerProfile?.plan === "pro" || isViewerAdmin) {
        isProViewer = true;
      }
    }

    // Exclude isPro properties for non-pro viewers unless the viewer owns the listing
    const filteredList = isProViewer
      ? list
      : list.filter((p: any) => !p.isPro || ownsProperty(session, p));

    return NextResponse.json({ success: true, data: filteredList, properties: filteredList });
  } catch (err: any) {
    console.error("GET /api/posts error:", err);
    return NextResponse.json({ success: false, error: err.message, data: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const userId = session.uid;

    // Verify property limit for standard subscription (max 3 properties)
    const profile = await getUserProfile(userId);
    const userPlan = profile?.plan || "standard";
    const isAdmin = await isUserAdmin(userId, session.email, session.emailVerified);

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

    // Only operators may create listings on behalf of another host
    const activeHostId = session.isSuperAdmin && hostId ? hostId : userId;

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

    // Property ids are derived from the slug; never let a new listing overwrite someone else's
    const normalizedSlug = String(slug).trim().toLowerCase();
    const clash = await getProperty(normalizedSlug);
    if (clash && !ownsProperty(session, clash) && !session.isSuperAdmin) {
      return NextResponse.json({ success: false, error: "That listing address is already taken.", data: "Slug already in use." }, { status: 409 });
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
