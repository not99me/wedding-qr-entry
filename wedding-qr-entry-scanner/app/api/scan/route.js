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

    // Guest has not registered yet
    if (!invitation.registered || !invitation.name?.trim()) {
      return NextResponse.json({
        result: "NOT_REGISTERED",
        name: "",
        invitation: invitation.number,
        message: "This guest has not registered yet.",
      });
    }

    // This guest already entered
    if (invitation.checkedIn) {
      return NextResponse.json({
        result: "ALREADY_USED",
        name: invitation.name,
        invitation: invitation.number,
        checkedInAt: invitation.checkedInAt || null,
      });
    }

    // Allow the guest in
    invitation.checkedIn = true;
    invitation.checkedInAt = new Date().toISOString();

    await redis.set(key, invitation);

    return NextResponse.json({
      result: "GRANTED",
      name: invitation.name,
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
