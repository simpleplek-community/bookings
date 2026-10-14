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
    return NextResponse.json({
      success: true,
      data: {
        isAdmin,
        plan: profile?.plan || (isAdmin ? "pro" : "free"),
        email: profile?.email || email || "",
        subdomain: profile?.subdomain || "",
        displayName: profile?.displayName || "",
        bio: profile?.bio || "",
      }
    });
  } catch (err: any) {
    console.error("GET /api/user/profile error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, subdomain, displayName, bio } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required." }, { status: 400 });
    }

    const updateData: Record<string, any> = {};

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

      const reserved = ["www", "admin", "api", "subdomain", "dashboard", "subscribe", "login", "bookings", "estimate", "mail", "support", "stays"];
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

    return NextResponse.json({
      success: true,
      data: {
        subdomain: updatedProfile?.subdomain || "",
        displayName: updatedProfile?.displayName || "",
        bio: updatedProfile?.bio || "",
        plan: updatedProfile?.plan || "standard",
      }
    });
  } catch (err: any) {
    console.error("POST /api/user/profile error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
