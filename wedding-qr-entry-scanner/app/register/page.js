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
          message: "Please enter your invitation code.",
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

    if (name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Name is too long.",
        },
        { status: 400 }
      );
    }

    const redis = getRedis();

    const key = `${PREFIX}${code}`;

    const invitation = await redis.get(key);

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invitation code.",
        },
        { status: 404 }
      );
    }

    if (invitation.registered) {
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
      name,
      code,
      message: "Invitation registered successfully.",
    });
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Server error.",
      },
      { status: 500 }
    );
  }
}
