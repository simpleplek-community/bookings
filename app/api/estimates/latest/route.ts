import { NextRequest, NextResponse } from "next/server";
import { getLatestEstimateForUser } from "@/lib/firebase";
import { getSessionUser, unauthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const userId = session.uid;
    const propertyId = searchParams.get("propertyId") || undefined;

    const estimate = await getLatestEstimateForUser(userId, propertyId);
    return NextResponse.json({ success: true, data: estimate });
  } catch (error: any) {
    console.error("GET /api/estimates/latest error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
