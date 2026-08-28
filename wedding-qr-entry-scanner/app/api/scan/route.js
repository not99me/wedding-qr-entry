import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const USED_KEY = "wedding:fn:used";

export async function POST(request) {
  try {
    const redis = getRedis();

    const firstScan = await redis.set(
      USED_KEY,
      "true",
      { nx: true }
    );

    if (firstScan === "OK") {
      return NextResponse.json({
        result: "GRANTED",
      });
    }

    return NextResponse.json({
      result: "ALREADY_USED",
    });
  } catch {
    return NextResponse.json(
      {
        result: "ERROR",
        message: "Server error.",
      },
      { status: 500 }
    );
  }
}
