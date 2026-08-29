import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const redis = getRedis();

    // Test Redis connection first
    await redis.ping();

    const invitations = [];

    for (let i = 1; i <= 250; i++) {
      const code = `WED-${String(i).padStart(3, "0")}`;
      const key = `wedding:invitation:${code}`;

      const existing = await redis.get(key);

      if (!existing) {
        const invitation = {
          number: i,
          code,
          name: "",
          registered: false,
          checkedIn: false,
        };

        await redis.set(key, invitation);
        invitations.push(invitation);
      }
    }

    return NextResponse.json({
      success: true,
      created: invitations.length,
    });
  } catch (error) {
    console.error("INVITATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unknown server error",
      },
      { status: 500 }
    );
  }
}
