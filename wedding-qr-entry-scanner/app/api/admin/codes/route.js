import { NextResponse } from "next/server";
import { getRedis, KEYS } from "@/lib/redis";
import { isAdminRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  const [allCodes, usedCodes] = await Promise.all([
    redis.smembers(KEYS.validCodes),
    redis.smembers(KEYS.usedCodes),
  ]);
  const usedSet = new Set(usedCodes);
  const codes = allCodes
    .sort()
    .map((code) => ({ code, used: usedSet.has(code) }));
  return NextResponse.json({ codes });
}

export async function POST(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }
  const redis = getRedis();
  const added = await redis.sadd(KEYS.validCodes, code);
  return NextResponse.json({ added: added === 1, code });
}

export async function DELETE(request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }
  const redis = getRedis();
  await Promise.all([
    redis.srem(KEYS.validCodes, code),
    redis.srem(KEYS.usedCodes, code),
    redis.hdel(KEYS.usedAt, code),
  ]);
  return NextResponse.json({ removed: true, code });
}
