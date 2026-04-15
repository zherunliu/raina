import Redis from "ioredis";
import { getConfig, logger } from "../config";

let redis: Redis | null = null;

export function initRedis(): void {
  const cfg = getConfig().redis;
  redis = new Redis({
    host: cfg.host,
    port: cfg.port,
    password: cfg.password ?? undefined,
    db: cfg.db,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });
}

export async function testRedisConnection(): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.connect();
    await redis.ping();
    return true;
  } catch (err: unknown) {
    logger.warn({ err }, "Redis connection test failed");
    return false;
  }
}

export async function setRedisCache(
  key: string,
  value: string,
  expirationSec?: number,
): Promise<void> {
  if (!redis) throw new Error("Redis not initialized");
  if (expirationSec) {
    await redis.set(key, value, "EX", expirationSec);
    return;
  }
  await redis.set(key, value);
}

export async function getRedisCache(key: string): Promise<string | null> {
  if (!redis) throw new Error("Redis not initialized");
  return redis.get(key);
}

export async function deleteRedisCache(key: string): Promise<void> {
  if (!redis) throw new Error("Redis not initialized");
  await redis.del(key);
}
