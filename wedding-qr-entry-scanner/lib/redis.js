import { Redis } from "@upstash/redis";

let redis = null;

export function getRedis() {
  if (redis) return redis;

  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Redis environment variables are missing. Expected UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN or KV_REST_API_URL/KV_REST_API_TOKEN."
    );
  }

  redis = new Redis({
    url,
    token,
  });

  return redis;
}

export const KEYS = {
  validCodes: "wed:valid_codes",
  usedCodes: "wed:used_codes",
  usedAt: "wed:used_at",
  history: "wed:history",
  invalidCount: "wed:invalid_count",
};

export const HISTORY_MAX_LENGTH = 500;
