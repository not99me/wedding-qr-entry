import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const PREFIX = "wedding:invitation:";

export async function POST() {
  try {
    const redis = getRedis();

    await redis.ping();

    for (let i = 1; i <= 250; i++) {
      const code = `WED-${String(i).padStart(3, "0")}`;

      await redis.set(`${PREFIX}${code}`, {
        number: i,
        code,
        name: "",
        registered: false,
        checkedIn: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: "All 250 invitations reset successfully.",
    });
  } catch (error) {
    console.error("RESET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Reset failed.",
      },
      { status: 500 }
    );
  }
}
