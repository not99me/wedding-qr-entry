import { NextResponse } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();

    const code =
      typeof body?.code === "string"
        ? body.code.trim().toUpperCase()
        : "";

    if (!code) {
      return NextResponse.json({
        result: "INVALID",
        message: "No invitation code was provided.",
      });
    }

    // Accept WED-001 through WED-260
    if (
      !/^WED-(00[1-9]|0[1-9][0-9]|1[0-9][0-9]|2[0-5][0-9]|260)$/.test(
        code
      )
    ) {
      return NextResponse.json({
        result: "INVALID",
        message: "Invalid invitation code.",
      });
    }

    const redis = getRedis();

    // Check whether this invitation exists
    const exists = await redis.sismember(KEYS.validCodes, code);

    if (!exists) {
      return NextResponse.json({
        result: "INVALID",
        message: `Invitation ${code} does not exist.`,
      });
    }

    // Check whether it was already used
    const alreadyUsed = await redis.sismember(KEYS.usedCodes, code);

    if (alreadyUsed) {
      const checkedInAt = await redis.hget(KEYS.usedAt, code);

      return NextResponse.json({
        result: "ALREADY_USED",
        invitation: code,
        checkedInAt: checkedInAt || null,
        message: "This invitation has already been used.",
      });
    }

    // Mark invitation as used
    await Promise.all([
      redis.sadd(KEYS.usedCodes, code),
      redis.hset(KEYS.usedAt, {
        [code]: new Date().toISOString(),
      }),
    ]);

    return NextResponse.json({
      result: "GRANTED",
      invitation: code,
      message: "Access granted.",
    });
  } catch (error) {
    console.error("SCAN ERROR:", error);

    return NextResponse.json(
      {
        result: "ERROR",
        message: error?.message || "Server error.",
      },
      {
        status: 500,
      }
    );
  }
}
