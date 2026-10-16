import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { getSessionUser, unauthorized, forbidden } from "@/lib/auth";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function PUT(req: NextRequest) {
  try {
    // Local development stand-in for R2 only
    if (process.env.VERCEL || process.env.R2_ACCESS_KEY_ID) {
      return forbidden("Mock uploads are disabled in this environment.");
    }
    const session = await getSessionUser(req);
    if (!session) return unauthorized();

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
    }
    if (!key.startsWith(`hosts/${session.uid}/`)) {
      return forbidden("Upload key does not belong to you.");
    }

    // Read binary data from the request body
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to public/uploads directory
    const targetPath = path.resolve(UPLOADS_DIR, key);
    if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    const targetDir = path.dirname(targetPath);

    // Ensure the folder exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(targetPath, buffer);
    console.log(`[Mock Upload] Saved file to ${targetPath}`);

    return NextResponse.json({ success: true, url: `/uploads/${key}` });
  } catch (error: any) {
    console.error("[Mock Upload] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
