import { NextRequest, NextResponse } from "next/server";
import { promoteUserToAdmin } from "@/lib/firebase";
import { getSessionUser, isPaymentsLive, unauthorized, forbidden } from "@/lib/auth";

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
    const { plan, billingInterval } = body;

    const resolvedPlan = plan || "pro";
    const resolvedInterval = billingInterval || "annual";
    await promoteUserToAdmin(userId, resolvedPlan, resolvedInterval);
    console.log(`[Dev Mock Sub] Promoted user ${userId} to ${resolvedPlan} role (${resolvedInterval}) successfully.`);

    return NextResponse.json({ success: true, message: `User promoted to ${resolvedPlan} role.` });
  } catch (err: unknown) {
    console.error("Mock subscribe confirmation error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
