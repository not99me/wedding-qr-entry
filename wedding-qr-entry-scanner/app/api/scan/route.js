import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const INVITATION_PREFIX = "wedding:invitation:";

export async function POST(request) {
  try {
    const body = await request.json();

    const code =
      typeof body?.code === "string"
        ? body.code.trim()
        : "";

    if (!code) {
      return NextResponse.json({
        result: "INVALID",
      });
    }

    const redis = getRedis();

    const invitation = await redis.get(
      `${INVITATION_PREFIX}${code}`
    );

    if (!invitation) {
      return NextResponse.json({
        result: "INVALID",
      });
    }

    if (invitation.checkedIn) {
      return NextResponse.json({
        result: "ALREADY_USED",
        name: invitation.name,
        invitation: invitation.number,
      });
    }

    invitation.checkedIn = true;
    invitation.checkedInAt = new Date().toISOString();

    await redis.set(
      `${INVITATION_PREFIX}${code}`,
      invitation
    );

    return NextResponse.json({
      result: "GRANTED",
      name: invitation.name,
      invitation: invitation.number,
    });
  } catch (error) {
    console.error("SCAN ERROR:", error);

    return NextResponse.json(
      {
        result: "ERROR",
        message: "Server error.",
      },
      {
        status: 500,
      }
    );
  }
}
