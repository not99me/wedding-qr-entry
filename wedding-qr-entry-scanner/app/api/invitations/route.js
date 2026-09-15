import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const PREFIX = "wedding:invitation:";

export async function POST() {
  try {
    const redis = getRedis();

    await redis.ping();

    let created = 0;
    let existing = 0;

    // Only create the NEW invitations: 251–260
    for (let i = 251; i <= 260; i++) {
      const code = `WED-${String(i).padStart(3, "0")}`;
      const key = `${PREFIX}${code}`;

      const alreadyExists = await redis.get(key);

      if (alreadyExists) {
        existing++;
        continue;
      }

      await redis.set(key, {
        number: i,
        code,
        name: "",
        registered: false,
        checkedIn: false,
      });

      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      existing,
      total: created + existing,
      message: `New invitations 251–260 processed.`,
    });
  } catch (error) {
    console.error("INVITATION CREATE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Could not create invitations.",
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

    // Check all 260 invitations
    for (let i = 1; i <= 260; i++) {
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
