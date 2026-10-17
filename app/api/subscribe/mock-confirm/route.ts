import { NextRequest, NextResponse } from "next/server";
import { promoteUserToAdmin, logTermsConsent } from "@/lib/firebase";
import { getSessionUser, isPaymentsLive, unauthorized, forbidden } from "@/lib/auth";

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
    // Development bypass only: with real payments configured, the signed Yoco webhook upgrades accounts.
    if (isPaymentsLive()) {
      return forbidden("Subscriptions are activated by the payment provider once payment is confirmed.");
    }
    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const userId = session.uid;

    const body = await request.json().catch(() => ({}));
    const { plan, billingInterval, consentAcknowledged } = body;

    const resolvedPlan = plan || "pro";
    const resolvedInterval: "monthly" | "annual" = billingInterval === "monthly" ? "monthly" : "annual";
    let consentAuditId: string | undefined = undefined;

    // Only Pro Annual involves Share Block / Leasehold Capital Acquisition
    if (resolvedInterval === "annual") {
      if (!consentAcknowledged) {
        return NextResponse.json(
          {
            success: false,
            error: "Explicit consent acknowledging the Share Block / Leasehold Terms & Conditions is required for Pro Annual.",
          },
          { status: 400 }
        );
      }

      const ipAddress = getClientIp(request);
      const userAgent = request.headers.get("user-agent") || undefined;

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
      console.log(`[Dev Mock Sub] Consent logged (${auditRecord.id}). Promoted user ${userId} to ${resolvedPlan} role (${resolvedInterval}).`);
    } else {
      console.log(`[Dev Mock Sub] Promoted user ${userId} to standard ${resolvedPlan} role (${resolvedInterval}) without Share Block.`);
    }

    await promoteUserToAdmin(userId, resolvedPlan, resolvedInterval);

    return NextResponse.json({
      success: true,
      message: `User promoted to ${resolvedPlan} role (${resolvedInterval}).`,
      ...(consentAuditId ? { consentAuditId } : {}),
    });
  } catch (err: unknown) {
    console.error("Mock subscribe confirmation error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
