import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const VALID_CODE = "WEDDING-2026-FN";
const USED_KEY = "wedding:fn:used";

export async function POST(request) {
  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (code !== VALID_CODE) {
      return NextResponse.json({ result: "INVALID" });
    }

    const redis = getRedis();

    const firstScan = await redis.set(USED_KEY, "true", { nx: true });

    if (firstScan === "OK") {
      return NextResponse.json({ result: "GRANTED" });
    }

    return NextResponse.json({ result: "ALREADY_USED" });
  } catch (error) {
    return NextResponse.json(
      { result: "ERROR", message: "Server error." },
      { status: 500 }
    );
  }
}
