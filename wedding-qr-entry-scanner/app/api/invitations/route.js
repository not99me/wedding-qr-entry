import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const dynamic = "force-dynamic";

const INVITATION_PREFIX = "wedding:invitation:";

export async function POST() {
  try {
    const redis = getRedis();

    let added = 0;
    let existing = 0;

    for (let i = 251; i <= 260; i++) {
      const code = `WED-${String(i).padStart(3, "0")}`;
      const key = `${INVITATION_PREFIX}${code}`;

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

      added++;
    }

    return NextResponse.json({
      success: true,
      added,
      existing,
      total: 10,
      message: "WED-251 through WED-260 added successfully.",
    });
  } catch (error) {
    console.error("ADD NEW INVITATIONS ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Could not add new invitations.",
      },
      { status: 500 }
    );
  }
}
