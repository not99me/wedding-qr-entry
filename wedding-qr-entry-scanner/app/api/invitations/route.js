import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const PREFIX = "wedding:invitation:";

export async function POST() {
  try {
    const redis = getRedis();

    await redis.ping();

    let reset = 0;

    for (let i = 1; i <= 250; i++) {
      const code = `WED-${String(i).padStart(3, "0")}`;
      const key = `${PREFIX}${code}`;

      await redis.set(key, {
        number: i,
        code,
        name: "",
        registered: false,
        checkedIn: false,
      });

      reset++;
    }

    return NextResponse.json({
      success: true,
      reset,
      message: "All 250 invitations have been reset.",
    });
  } catch (error) {
    console.error("INVITATION RESET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Could not reset invitations.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const redis = getRedis();

    await redis.ping();

    const invitations = [];

    for (let i = 1; i <= 250; i++) {
      const code = `WED-${String(i).padStart(3, "0")}`;
      const key = `${PREFIX}${code}`;

      const invitation = await redis.get(key);

      if (invitation) {
        invitations.push(invitation);
      }
    }

    return NextResponse.json({
      success: true,
      total: invitations.length,
      invitations,
    });
  } catch (error) {
    console.error("INVITATION CHECK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Could not check invitations.",
      },
      { status: 500 }
    );
  }
}
