import { NextRequest, NextResponse } from "next/server";
import { createCheckout } from "@/lib/yoco";
import { getSessionUser, unauthorized } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) return unauthorized("Please sign in to subscribe.");
    const userId = session.uid;

    const body = await request.json().catch(() => ({}));
    const { plan } = body;

    if (!plan) {
      return NextResponse.json({ success: false, error: "Missing required parameter (plan)" }, { status: 400 });
    }

    const isAnnual = plan === "annual";
    const resolvedAmountInCents = isAnnual ? 15000 : 1500;

    const host = request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const siteUrl = host ? `${proto}://${host}` : request.nextUrl.origin;

    const description = `Pro Subscription (${isAnnual ? "Annual" : "Monthly"} Plan)`;

    // Initialize Yoco checkout flow with "subscription" metadata
    const redirectUrl = await createCheckout({
      amountInCents: resolvedAmountInCents,
      description,
      metadata: {
        intent: "subscription",
        userId,
        plan: "pro",
        billingInterval: isAnnual ? "annual" : "monthly"
      },
      siteUrl
    });

    return NextResponse.json({ success: true, redirectUrl });
  } catch (err: any) {
    console.error("Subscription checkout error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
