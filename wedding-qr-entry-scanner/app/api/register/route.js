import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const PREFIX = "wedding:invitation:";

export async function POST(request) {
  try {
    const body = await request.json();

    const code =
      typeof body?.code === "string"
        ? body.code.trim().toUpperCase()
        : "";

    const name =
      typeof body?.name === "string"
        ? body.name.trim()
        : "";

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Invitation code is missing.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your name.",
        },
        { status: 400 }
      );
    }

    if (!/^WED-(00[1-9]|0[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|250)$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invitation code.",
        },
        { status: 400 }
      );
    }

    const redis = getRedis();

    // IMPORTANT:
    // This is the exact same key used by /api/invitations
    const key = `${PREFIX}${code}`;

    const invitation = await redis.get(key);

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message: `Invitation ${code} does not exist in the database.`,
        },
        { status: 404 }
      );
    }

    if (invitation.registered === true) {
      return NextResponse.json(
        {
          success: false,
          message: "This invitation has already been registered.",
        },
        { status: 409 }
      );
    }

    const updatedInvitation = {
      ...invitation,
      name,
      registered: true,
      checkedIn: false,
    };

    await redis.set(key, updatedInvitation);

    return NextResponse.json({
      success: true,
      code,
      name,
      invitation: updatedInvitation,
      message: "Registration successful.",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Server error.",
      },
      { status: 500 }
    );
  }
}
