import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const INVITATION_PREFIX = "wedding:invitation:";

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

    if (
      !/^WED-(00[1-9]|0[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|250)$/.test(
        code
      )
    ) {
      return NextResponse.json({
        result: "INVALID",
        message: "Invalid invitation code.",
      });
    }

    const redis = getRedis();

    const key = `${INVITATION_PREFIX}${code}`;

    const invitation = await redis.get(key);

    // QR code does not exist
    if (!invitation) {
      return NextResponse.json({
        result: "INVALID",
        message: `Invitation ${code} does not exist.`,
      });
    }

    // Already entered
    if (invitation.checkedIn === true) {
      return NextResponse.json({
        result: "ALREADY_USED",
        name: invitation.name || "",
        invitation: invitation.number,
        checkedInAt: invitation.checkedInAt || null,
        message: "This invitation has already been used.",
      });
    }

    // First scan = allow entry
    invitation.checkedIn = true;
    invitation.checkedInAt = new Date().toISOString();

    await redis.set(key, invitation);

    return NextResponse.json({
      result: "GRANTED",
      name: invitation.name || "",
      invitation: invitation.number,
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
