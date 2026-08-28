import { NextResponse } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  const [total, used, invalidScans] = await Promise.all([
    redis.scard(KEYS.validCodes),
    redis.scard(KEYS.usedCodes),
    redis.get(KEYS.invalidCount),
  ]);
  const totalNum = total || 0;
  const usedNum = used || 0;
  return NextResponse.json({
    total: totalNum,
    used: usedNum,
    remaining: Math.max(totalNum - usedNum, 0),
    invalidScans: Number(invalidScans) || 0,
  });
}
