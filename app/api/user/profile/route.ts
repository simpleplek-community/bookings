import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, isUserAdmin, updateUserProfile, getHostIdBySubdomain } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId query parameter is required." }, { status: 400 });
    }

    const profile = await getUserProfile(userId);
    const isAdmin = await isUserAdmin(userId, email);
    const plan = profile?.plan || (isAdmin ? "pro" : "free");

    let subscriptionExpiresAt = profile?.subscriptionExpiresAt || null;
    let billingInterval = profile?.billingInterval || (plan === "pro" ? "annual" : null);
    let subscriptionStatus = profile?.subscriptionStatus || (plan === "pro" ? "active" : "none");

    // If account has pro access but no expiry date set in legacy records, provide default active expiry (1 year)
    if (plan === "pro" && !subscriptionExpiresAt) {
      const defaultExpiry = new Date();
      defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
      subscriptionExpiresAt = defaultExpiry.toISOString();
      subscriptionStatus = "active";
      billingInterval = billingInterval || "annual";
    }

    // Check if subscription has expired
    if (subscriptionExpiresAt && new Date(subscriptionExpiresAt).getTime() < Date.now()) {
      subscriptionStatus = "expired";
    }

    return NextResponse.json({
      success: true,
      data: {
        isAdmin,
        plan,
        billingInterval,
        subscriptionExpiresAt,
        subscriptionStatus,
        subscriptionStartedAt: profile?.subscriptionStartedAt || null,
        email: profile?.email || email || "",
        subdomain: profile?.subdomain || "",
        displayName: profile?.displayName || "",
        bio: profile?.bio || "",
      }
    });
  } catch (err: unknown) {
    console.error("GET /api/user/profile error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, subdomain, displayName, bio, renewInterval } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (displayName !== undefined) {
      updateData.displayName = typeof displayName === "string" ? displayName.trim() : "";
    }

    if (bio !== undefined) {
      updateData.bio = typeof bio === "string" ? bio.trim() : "";
    }

    if (renewInterval) {
      const expiry = new Date();
      if (renewInterval === "monthly") {
        expiry.setDate(expiry.getDate() + 30);
      } else {
        expiry.setFullYear(expiry.getFullYear() + 1);
      }
      updateData.plan = "pro";
      updateData.billingInterval = renewInterval;
      updateData.subscriptionExpiresAt = expiry.toISOString();
      updateData.subscriptionStatus = "active";
      updateData.isAdmin = true;
    }

    if (subdomain !== undefined) {
      // Clean subdomain: lowercase, alphanumeric and dashes only, max 63 characters
      const cleanSubdomain = (subdomain || "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .trim();

      const reserved = ["www", "admin", "api", "subdomain", "dashboard", "subscribe", "login", "bookings", "estimate", "mail", "support", "stays", "profile"];
      if (cleanSubdomain && reserved.includes(cleanSubdomain)) {
        return NextResponse.json({ success: false, error: "This subdomain is reserved and cannot be used." }, { status: 400 });
      }

      if (cleanSubdomain) {
        const existingHostId = await getHostIdBySubdomain(cleanSubdomain);
        if (existingHostId && existingHostId !== userId) {
          return NextResponse.json({ success: false, error: "That address is already taken." }, { status: 409 });
        }
      }

      updateData.subdomain = cleanSubdomain || null;
    }

    // Save to user profile
    await updateUserProfile(userId, updateData);

    const updatedProfile = await getUserProfile(userId);
    const plan = updatedProfile?.plan || "standard";
    let subscriptionExpiresAt = updatedProfile?.subscriptionExpiresAt || null;
    let subscriptionStatus = updatedProfile?.subscriptionStatus || (plan === "pro" ? "active" : "inactive");

    if (plan === "pro" && !subscriptionExpiresAt) {
      const defaultExpiry = new Date();
      defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
      subscriptionExpiresAt = defaultExpiry.toISOString();
    }

    if (subscriptionExpiresAt && new Date(subscriptionExpiresAt).getTime() < Date.now()) {
      subscriptionStatus = "expired";
    }

    return NextResponse.json({
      success: true,
      data: {
        subdomain: updatedProfile?.subdomain || "",
        displayName: updatedProfile?.displayName || "",
        bio: updatedProfile?.bio || "",
        plan,
        billingInterval: updatedProfile?.billingInterval || (plan === "pro" ? "annual" : null),
        subscriptionExpiresAt,
        subscriptionStatus,
      }
    });
  } catch (err: unknown) {
    console.error("POST /api/user/profile error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
