import { NextResponse } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  const raw = await redis.lrange(KEYS.history, 0, 199);
  const events = raw
    .map((entry) => {
      try {
        return typeof entry === "string" ? JSON.parse(entry) : entry;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return NextResponse.json({ events });
}
