import { NextRequest, NextResponse } from "next/server";
import { createCheckout } from "@/lib/yoco";
import { getSessionUser, unauthorized } from "@/lib/auth";
import { logTermsConsent } from "@/lib/firebase";

function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "127.0.0.1";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) return unauthorized("Please sign in to subscribe.");
    const userId = session.uid;

    const body = await request.json().catch(() => ({}));
    const { plan, consentAcknowledged } = body;

    if (!plan) {
      return NextResponse.json({ success: false, error: "Missing required parameter (plan)" }, { status: 400 });
    }

    const isAnnual = plan === "annual";
    const resolvedAmountInCents = isAnnual ? 15000 : 1500;
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || undefined;
    let consentAuditId: string | undefined = undefined;

    // Only Pro Annual involves Share Block / Leasehold Capital Acquisition
    if (isAnnual) {
      if (!consentAcknowledged) {
        return NextResponse.json(
          {
            success: false,
            error: "Explicit consent to Share Block / Leasehold Terms & Conditions (Sections 11 & 12) is required before proceeding to payment for Pro Annual.",
          },
          { status: 400 }
        );
      }

      // Log timestamped audit record of explicit consent in database
      const auditRecord = await logTermsConsent({
        userId,
        ipAddress,
        userAgent,
        plan: "annual",
        termsVersion: "2025.1",
        sectionsAcknowledged: [
          "11.2 Pro Membership: Share Block / Leasehold Acquisition",
          "12 Pro Plan Cancellation & Member Credit System",
        ],
        consentStatement:
          "I have read, understood, and explicitly agree to the Share Block / Leasehold Acquisition Terms & Conditions (Sections 11 & 12), including capital allocation, operational levies, cancellation penalties, and closed-loop non-cash Member Credits.",
      });

      consentAuditId = auditRecord.id;
      console.log(`[Terms Audit] Logged Pro Annual consent ${auditRecord.id} for user ${userId} from IP ${ipAddress}.`);
    }

    const host = request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const siteUrl = host ? `${proto}://${host}` : request.nextUrl.origin;

    const description = isAnnual
      ? "Pro Annual Subscription (Share Block & Free Bookings)"
      : "Pro Monthly Subscription";

    // Initialize Yoco checkout flow with "subscription" metadata and optional consentAuditId
    const redirectUrl = await createCheckout({
      amountInCents: resolvedAmountInCents,
      description,
      metadata: {
        intent: "subscription",
        userId,
        plan: "pro",
        billingInterval: isAnnual ? "annual" : "monthly",
        ...(consentAuditId ? { consentAuditId } : {}),
      },
      siteUrl,
    });

    return NextResponse.json({ success: true, redirectUrl, consentAuditId });
  } catch (err: unknown) {
    console.error("Subscription checkout error:", err);
    const message = err instanceof Error ? err.message : "An error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
