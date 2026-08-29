```javascript
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

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          message: "Invitation code is missing.",
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
    const key = `${PREFIX}${code}`;

    const invitation = await redis.get(key);

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          message: `Invitation ${code} does not exist.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      code,
      invitation,
    });
  } catch (error) {
    console.error("INVITATION ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Server error.",
      },
      { status: 500 }
    );
  }
}
```
