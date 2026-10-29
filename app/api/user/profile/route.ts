import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, isUserAdmin, updateUserProfile, getHostIdBySubdomain } from "@/lib/firebase";
import { getSessionUser, unauthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const userId = session.uid;
    const email = session.email;

    const profile = await getUserProfile(userId);
    const isAdmin = await isUserAdmin(userId, email, session.emailVerified);
    const plan = profile?.plan || (isAdmin ? "pro" : "free");

    const isSubscribed = plan === "pro" || plan === "standard" || isAdmin;

    let subscriptionExpiresAt = profile?.subscriptionExpiresAt || null;
    let billingInterval = profile?.billingInterval || (plan === "standard" ? "monthly" : (plan === "pro" ? "annual" : null));
    let subscriptionStatus = profile?.subscriptionStatus || (isSubscribed ? "active" : "none");

    // If account has subscription access (Pro or Standard) but no expiry date set in records, provide default active expiry
    if (isSubscribed && !subscriptionExpiresAt) {
      const defaultExpiry = new Date();
      if (billingInterval === "monthly" || plan === "standard") {
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        billingInterval = billingInterval || "monthly";
      } else {
        defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
        billingInterval = billingInterval || "annual";
      }
      subscriptionExpiresAt = defaultExpiry.toISOString();
      subscriptionStatus = "active";
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
    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const userId = session.uid;
    const body = await request.json().catch(() => ({}));
    const { subdomain, displayName, bio } = body;

    const updateData: Record<string, unknown> = {};

    if (displayName !== undefined) {
      updateData.displayName = typeof displayName === "string" ? displayName.trim() : "";
    }

    if (bio !== undefined) {
      updateData.bio = typeof bio === "string" ? bio.trim() : "";
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
    const isSubscribed = plan === "pro" || plan === "standard" || updatedProfile?.isAdmin || updatedProfile?.admin;
    let subscriptionExpiresAt = updatedProfile?.subscriptionExpiresAt || null;
    let billingInterval = updatedProfile?.billingInterval || (plan === "standard" ? "monthly" : (plan === "pro" ? "annual" : null));
    let subscriptionStatus = updatedProfile?.subscriptionStatus || (isSubscribed ? "active" : "inactive");

    if (isSubscribed && !subscriptionExpiresAt) {
      const defaultExpiry = new Date();
      if (billingInterval === "monthly" || plan === "standard") {
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
      } else {
        defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
      }
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
