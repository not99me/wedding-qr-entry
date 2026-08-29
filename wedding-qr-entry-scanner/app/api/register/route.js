import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

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

    if (!code || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter the invitation code and name.",
        },
        { status: 400 }
      );
    }

    const match = code.match(/^WED-(\d{3})$/);

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invitation code.",
        },
        { status: 400 }
      );
    }

    const number = Number(match[1]);

    if (number < 1 || number > 250) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid invitation code.",
        },
        { status: 400 }
      );
    }

    const redis = getRedis();

    /*
      Your invitation generator stores the invitations
      in the "wed:invitation:001" format.
    */
    const key = `wed:invitation:${String(number).padStart(3, "0")}`;

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
      number,
      code,
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
