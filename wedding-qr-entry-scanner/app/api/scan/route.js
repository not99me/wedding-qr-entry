import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const VALID_CODE = "WEDDING-2026-FN";

let used = false;

export async function POST(request) {
  try {
    const body = await request.json();

    const code =
      typeof body?.code === "string"
        ? body.code.trim()
        : "";

    console.log("QR CODE:", JSON.stringify(code));

    if (code !== VALID_CODE) {
      return NextResponse.json({
        result: "INVALID",
      });
    }

    if (!used) {
      used = true;

      return NextResponse.json({
        result: "GRANTED",
      });
    }

    return NextResponse.json({
      result: "ALREADY_USED",
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
