import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserByEmail, createCustomToken } from "@/lib/firebase";
import { sendMagicLinkEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "A valid email is required." }, { status: 400 });
    }

    // Build the link from the host this request was served on, never from a client-supplied
    // origin, so a sign-in token can't be mailed out pointing at an attacker's site.
    const host = request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const origin = host ? `${proto}://${host}` : request.nextUrl.origin;

    // Get or create user
    const uid = await getOrCreateUserByEmail(email);

    // Create a custom token for that user
    const customToken = await createCustomToken(uid);

    // Construct the magic link
    const magicLink = `${origin}/login?token=${customToken}`;

    // Send the email
    const emailResult = await sendMagicLinkEmail(email, magicLink);

    if (!emailResult) {
      return NextResponse.json({ success: false, error: "Failed to send magic link email." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Magic link sent successfully."
    });
  } catch (err) {
    console.error("POST /api/auth/magic-link error:", err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred during magic link generation."
    }, { status: 500 });
  }
}
