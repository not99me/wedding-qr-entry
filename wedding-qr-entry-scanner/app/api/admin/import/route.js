import { NextResponse } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Accepts either multipart/form-data with a "file" field, or a raw text
// body of newline/comma separated codes. Either way, only ticket codes are
// ever read from the upload — no other columns are stored.
export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let text = "";
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    text = await file.text();
  } else {
    text = await request.text();
  }

  const codes = Array.from(
    new Set(
      text
        .split(/[\r\n,]+/)
        .map((line) => line.trim())
        .filter(Boolean)
    )
  );

  if (codes.length === 0) {
    return NextResponse.json({ error: "No codes found in upload." }, { status: 400 });
  }

  const redis = getRedis();
  const added = await redis.sadd(KEYS.validCodes, ...codes);

  return NextResponse.json({ imported: codes.length, newlyAdded: added });
}
