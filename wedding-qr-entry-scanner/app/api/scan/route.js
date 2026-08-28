import { NextResponse } from "next/server";
import { getRedis, KEYS, HISTORY_MAX_LENGTH } from "@/lib/redis";

export const dynamic = "force-dynamic";

// The frontend never decides access. It only shows whatever this endpoint
// returns. This is the single source of truth guards on every phone hit.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ result: "INVALID", message: "Malformed request." }, { status: 400 });
  }

  const rawCode = typeof body?.code === "string" ? body.code : "";
  const code = rawCode.trim();

  if (!code) {
    return NextResponse.json({ result: "INVALID", message: "Empty code." }, { status: 400 });
  }

  const redis = getRedis();
  const now = new Date().toISOString();

  // Step 1: is this code registered at all?
  const isValid = await redis.sismember(KEYS.validCodes, code);

  if (!isValid) {
    await Promise.all([
      redis.incr(KEYS.invalidCount),
      pushHistory(redis, { code, result: "INVALID", time: now }),
    ]);
    return NextResponse.json({ result: "INVALID" });
  }

  // Step 2: atomic check-in. SADD on a Redis set only ever returns 1 for the
  // very first caller that adds a given member; every subsequent caller for
  // the same member gets 0, even under concurrent requests from different
  // guards. This is what makes the "only one guard can accept a code" rule
  // safe without a separate lock or transaction.
  const wasFirstToCheckIn = await redis.sadd(KEYS.usedCodes, code);

  if (wasFirstToCheckIn === 1) {
    await Promise.all([
      redis.hset(KEYS.usedAt, { [code]: now }),
      pushHistory(redis, { code, result: "ACCEPTED", time: now }),
    ]);
    return NextResponse.json({ result: "GRANTED" });
  }

  await pushHistory(redis, { code, result: "ALREADY_USED", time: now });
  return NextResponse.json({ result: "ALREADY_USED" });
}

async function pushHistory(redis, entry) {
  await redis.lpush(KEYS.history, JSON.stringify(entry));
  await redis.ltrim(KEYS.history, 0, HISTORY_MAX_LENGTH - 1);
}
