import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserByEmail, createCustomToken } from "@/lib/firebase";
import { sendMagicLinkEmail } from "@/lib/email";
import { trustedUrl } from "@/lib/trustedHosts";

/**
 * The login link must point at our site. The Host header is client-controlled,
 * so it is only used when it is one of our domains; otherwise SITE_URL.
 */
function resolveLoginOrigin(request: NextRequest): string | null {
  const host = request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const fromHost = trustedUrl(`${proto}://${host}`);
  if (fromHost) return fromHost.origin;
  return trustedUrl(process.env.SITE_URL)?.origin || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "A valid email is required." }, { status: 400 });
    }

    // Never build the link from a client-supplied origin or an untrusted Host header,
    // so a sign-in token can't be mailed out pointing at an attacker's site.
    const origin = resolveLoginOrigin(request);
    if (!origin) {
      return NextResponse.json({ success: false, error: "Sign-in links can't be sent from this site." }, { status: 400 });
    }

    // Get or create user
    const uid = await getOrCreateUserByEmail(email);

    // Create a custom token for that user
    const customToken = await createCustomToken(uid);

    // Construct the magic link
    const magicLink = `${origin}/login?token=${encodeURIComponent(customToken)}`;

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
      error: "An unexpected error occurred during magic link generation."
    }, { status: 500 });
  }
}
