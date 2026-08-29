import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VALID_CODE = "WEDDING-2026-FN";

export async function POST(request) {
  try {
    const body = await request.json();

    const code =
      typeof body?.code === "string"
        ? body.code.trim()
        : "";

    if (code === VALID_CODE) {
      return NextResponse.json({
        result: "GRANTED",
      });
    }

    return NextResponse.json({
      result: "INVALID",
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
