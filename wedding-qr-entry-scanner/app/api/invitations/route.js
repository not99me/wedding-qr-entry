import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const PREFIX = "wedding:invitation:";

export async function POST() {
  try {
    const redis = getRedis();

    await redis.ping();

    let created = 0;

    for (let i = 1; i <= 250; i++) {
      const code = `WED-${String(i).padStart(3, "0")}`;
      const key = `${PREFIX}${code}`;

      const existing = await redis.get(key);

      if (!existing) {
        await redis.set(key, {
          number: i,
          code,
          name: "",
          registered: false,
          checkedIn: false,
        });

        created++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      message:
        created === 0
          ? "All 250 invitations already exist."
          : `${created} invitations created.`,
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
