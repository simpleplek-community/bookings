import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/auth";
import { getTermsConsentLogs } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) return unauthorized();

    const logs = await getTermsConsentLogs(session.uid);
    return NextResponse.json({ success: true, logs });
  } catch (err: unknown) {
    console.error("Fetch terms consent logs error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
