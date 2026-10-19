import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/auth";
import { invitePreview, resolveInvite } from "@/lib/invites";

/** Summary of the stay behind an invite token. Read-only: joining is a separate, explicit POST. */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) return unauthorized();
    const { token } = await request.json().catch(() => ({}));

    const invite = await resolveInvite(token);
    if (!invite) {
      return NextResponse.json(
        { success: false, error: "This invite link is invalid or has been replaced by a newer one." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: await invitePreview(invite, session) });
  } catch (error: any) {
    console.error("POST /api/invites/preview error:", error);
    return NextResponse.json({ success: false, error: "Could not load this invitation." }, { status: 500 });
  }
}
