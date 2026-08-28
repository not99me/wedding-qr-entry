import { NextResponse } from "next/server";
import { getRedis, KEYS, HISTORY_MAX_LENGTH } from "@/lib/redis";

export const dynamic = "force-dynamic";

const WEDDING_CODE = "WEDDING-2026-FN";

export async function POST(request) {
  try {
    const redis = getRedis();

    // Make sure the one wedding code is registered.
    await redis.sadd(KEYS.validCodes, WEDDING_CODE);

    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (code !== WEDDING_CODE) {
      await redis.incr(KEYS.invalidCount);

      return NextResponse.json({
        result: "INVALID",
      });
    }

    // SADD returns 1 only the first time this code is used.
    const firstScan = await redis.sadd(KEYS.usedCodes, WEDDING_CODE);

    const now = new Date().toISOString();

    if (firstScan === 1) {
      await redis.hset(KEYS.usedAt, {
        [WEDDING_CODE]: now,
      });

      await redis.lpush(
        KEYS.history,
        JSON.stringify({
          code: WEDDING_CODE,
          result: "ACCEPTED",
          time: now,
        })
      );

      await redis.ltrim(
        KEYS.history,
        0,
        HISTORY_MAX_LENGTH - 1
      );

      return NextResponse.json({
        result: "GRANTED",
      });
    }

    await redis.lpush(
      KEYS.history,
      JSON.stringify({
        code: WEDDING_CODE,
        result: "ALREADY_USED",
        time: now,
      })
    );

    await redis.ltrim(
      KEYS.history,
      0,
      HISTORY_MAX_LENGTH - 1
    );

    return NextResponse.json({
      result: "ALREADY_USED",
    });
  } catch (error) {
    console.error("Scan error:", error);

    return NextResponse.json(
      {
        result: "ERROR",
        message: "Server error.",
      },
      { status: 500 }
    );
  }
}
