import { Redis } from "@upstash/redis";

// Uses Upstash Redis (serverless-friendly, works on Vercel's stateless functions).
// Env vars UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN come from the
// Vercel <-> Upstash integration (see README.md).
let redis;

export function getRedis() {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        "Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN environment variables."
      );
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// Key namespace used throughout the app. Kept in one place so it's easy to
// audit exactly what is stored: no guest data, only anonymous ticket state.
export const KEYS = {
  validCodes: "wed:valid_codes", // SET of every registered ticket code
  usedCodes: "wed:used_codes", // SET of ticket codes already checked in
  usedAt: "wed:used_at", // HASH code -> ISO timestamp of check-in
  history: "wed:history", // LIST of recent scan events (JSON strings)
  invalidCount: "wed:invalid_count", // counter of rejected/unknown scans
};

export const HISTORY_MAX_LENGTH = 500;
