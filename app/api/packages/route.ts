import { NextRequest, NextResponse } from "next/server";
import { createPackage, listPackages, getPackage, isUserAdmin, getProperty, getUserProfile } from "@/lib/firebase";
import { getSessionUser, ownsProperty, unauthorized, forbidden } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId") || undefined;
    const list = await listPackages(propertyId);
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    console.error("GET /api/packages error:", err);
    return NextResponse.json({ success: false, data: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const userId = session.uid;
    if (!(await isUserAdmin(userId, session.email, session.emailVerified))) {
      return forbidden("Unauthorized access: admin privileges required.");
    }

    const body = await request.json().catch(() => ({}));
    const {
      id,
      propertyId,
      name,
      price,
      description,
      category,
      isPro,
      isEnabled
    } = body;

    if (!propertyId || !name || price === undefined) {
      return NextResponse.json({ success: false, data: "Missing required fields (propertyId, name, price)" }, { status: 400 });
    }

    // Verify property ownership (multi-tenancy isolation)
    const property = await getProperty(propertyId);
    if (!property) {
      return NextResponse.json({ success: false, data: "Property not found." }, { status: 404 });
    }
    if (!ownsProperty(session, property) && !session.isSuperAdmin) {
      return forbidden("Unauthorized: You do not own the property for this package.");
    }

    // Updating an existing package id must not hijack a package belonging to another property
    if (id) {
      const existingPkg = await getPackage(id);
      if (existingPkg && existingPkg.propertyId !== propertyId && !session.isSuperAdmin) {
        const existingProperty = await getProperty(existingPkg.propertyId);
        if (!ownsProperty(session, existingProperty)) {
          return forbidden("Unauthorized: You do not own this package.");
        }
      }
    }

    // Verify subscription tier package category entitlements
    const profile = await getUserProfile(userId);
    const userPlan = profile?.plan || "standard";
    const resolvedCategory = category || "standard";
    const isProPackage = Boolean(isPro || category === "pro");

    if (userPlan === "standard" && (resolvedCategory !== "standard" || isProPackage)) {
      return NextResponse.json({
        success: false,
        data: "Package category entitlement restricted. Standard plan subscribers can only create packages in the 'standard' category for all guests. Upgrade to Pro to configure premium packages (Pro, Hosted, Add-on, Special)."
      }, { status: 403 });
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json({ success: false, data: "price must be a positive number" }, { status: 400 });
    }

    const packageRecord = await createPackage({
      id,
      propertyId,
      name,
      price: priceNum,
      description: description || "",
      category: resolvedCategory,
      isPro: isProPackage,
      isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true
    });

    return NextResponse.json({ success: true, data: packageRecord }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/packages error:", err);
    return NextResponse.json({ success: false, data: err.message }, { status: 500 });
  }
}
