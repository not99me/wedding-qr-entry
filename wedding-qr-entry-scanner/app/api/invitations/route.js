import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const INVITATION_PREFIX = "wedding:invitation:";

export async function POST() {
  try {
    const redis = getRedis();

    const invitations = [];

    for (let i = 1; i <= 250; i++) {
      const number = String(i).padStart(3, "0");

      // Unique code for this invitation
      const code = `WED-${number}`;

      const key = `${INVITATION_PREFIX}${code}`;

      const existing = await redis.get(key);

      // Don't overwrite an invitation that already exists
      if (!existing) {
        const invitation = {
          number: i,
          code,
          name: "",
          registered: false,
          checkedIn: false,
          createdAt: new Date().toISOString(),
        };

        await redis.set(key, invitation);

        invitations.push(invitation);
      }
    }

    return NextResponse.json({
      success: true,
      created: invitations.length,
      message:
        invitations.length === 250
          ? "250 invitations created."
          : `${invitations.length} new invitations created.`,
      invitations,
    });
  } catch (error) {
    console.error("INVITATION GENERATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not create invitations.",
      },
      {
        status: 500,
      }
    );
  }
}
