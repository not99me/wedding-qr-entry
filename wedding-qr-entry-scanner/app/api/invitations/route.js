import { NextResponse } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const redis = getRedis();

    // Add ONLY the new codes.
    // This does NOT modify or reset WED-001 through WED-250.
    const newCodes = [];

    for (let i = 251; i <= 260; i++) {
      newCodes.push(`WED-${String(i).padStart(3, "0")}`);
    }

    let added = 0;
    let existing = 0;

    for (const code of newCodes) {
      const result = await redis.sadd(KEYS.validCodes, code);

      if (result === 1) {
        added++;
      } else {
        existing++;
      }
    }

    return NextResponse.json({
      success: true,
      added,
      existing,
      total: newCodes.length,
      message: "WED-251 through WED-260 added successfully.",
    });
  } catch (error) {
    console.error("ADD NEW INVITATIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Could not add new invitations.",
      },
      { status: 500 }
    );
  }
}
