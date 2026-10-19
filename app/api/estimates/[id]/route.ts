import { NextRequest, NextResponse } from "next/server";
import { scopeStayForViewer } from "@/lib/auth";
import { loadStayForRequest } from "@/lib/stay-access";

/** The estimate as the caller may see it: guests get a read-only view without the invite token. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await loadStayForRequest(request, "estimate", id);
    if (!access.ok) return access.response;
    return NextResponse.json({ success: true, data: scopeStayForViewer(access.record, access.role, access.session.uid) });
  } catch (error: any) {
    console.error("GET /api/estimates/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
