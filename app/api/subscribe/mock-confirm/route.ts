import { NextRequest, NextResponse } from "next/server";
import { promoteUserToAdmin } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, plan, billingInterval } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing required parameter: userId" }, { status: 400 });
    }

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
