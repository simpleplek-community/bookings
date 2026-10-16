import { NextRequest, NextResponse } from "next/server";
import { saveUserDates, getUserDates } from "@/lib/firebase";
import { getSessionUser, unauthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const userId = session.uid;

    const dates = await getUserDates(userId);
    return NextResponse.json({ success: true, data: dates });
  } catch (err: any) {
    console.error("GET /api/user/dates error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const userId = session.uid;
    const body = await request.json().catch(() => ({}));
    const { fromDate, toDate } = body;

    if (!fromDate || !toDate) {
      return NextResponse.json({ success: false, error: "Missing required fields (fromDate, toDate)" }, { status: 400 });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ success: false, error: "Invalid check-in or check-out date parameters." }, { status: 400 });
    }

    const dates = await saveUserDates(userId, start.toISOString(), end.toISOString());
    return NextResponse.json({ success: true, data: dates });
  } catch (err: any) {
    console.error("POST /api/user/dates error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
