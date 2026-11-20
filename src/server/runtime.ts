import Redis from "ioredis";
import { llmConfig } from "./llm-config";
import { config } from "./config";
import { db, closeDatabase } from "./db";
const state = globalThis as typeof globalThis & {
  __rainaRuntime?: { redis?: Redis; ready?: Promise<void> };
};
const runtime = (state.__rainaRuntime ??= {});
export function initRuntime() {
  return (runtime.ready ??= (async () => {
    llmConfig();
    const c = config();
    await db().query("SELECT 1");
    if (c.REDIS_ENABLED === "true") {
      const redis = (runtime.redis = new Redis({
        host: c.REDIS_HOST,
        port: c.REDIS_PORT,
        password: c.REDIS_PASSWORD || undefined,
        db: c.REDIS_DB,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      }));
      redis.on("error", (error) =>
        console.error("Redis connection:", error.message),
      );
      await redis.connect();
      await redis.ping();
    }
  })().catch(async (error) => {
    await closeRuntime();
    throw error;
  }));
}
export function cache() {
  return runtime.redis;
}
export async function closeRuntime() {
  const client = runtime.redis;
  runtime.redis = undefined;
  runtime.ready = undefined;
  if (client) client.disconnect();
  await closeDatabase();
}
