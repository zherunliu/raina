import "dotenv/config";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createConnection } from "mysql2/promise";
import Redis from "ioredis";
import { config } from "../src/server/config";
export default async function teardown() {
  let info: { database: string; dataDir: string };
  try {
    info = JSON.parse(await readFile(".test-runtime.json", "utf-8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  if (
    !/^raina_e2e_\d+$/.test(info.database) ||
    !info.dataDir.startsWith(join(tmpdir(), "raina-e2e-"))
  )
    throw new Error("Invalid test resource namespace");
  const c = config();
  const connection = await createConnection({
    host: c.MYSQL_HOST,
    port: c.MYSQL_PORT,
    user: c.MYSQL_USER,
    password: c.MYSQL_PASSWORD,
  });
  try {
    await connection.query("DROP DATABASE IF EXISTS `" + info.database + "`");
  } finally {
    await connection.end();
  }
  if (c.REDIS_ENABLED === "true") {
    const redis = new Redis({
      host: c.REDIS_HOST,
      port: c.REDIS_PORT,
      password: c.REDIS_PASSWORD || undefined,
      db: c.REDIS_DB,
      maxRetriesPerRequest: 1,
    });
    try {
      let cursor = "0";
      do {
        const result = await redis.scan(
          cursor,
          "MATCH",
          `raina:${info.database}:*`,
          "COUNT",
          100,
        );
        cursor = result[0];
        if (result[1].length) await redis.del(...result[1]);
      } while (cursor !== "0");
    } finally {
      redis.disconnect();
    }
  }
  await rm(info.dataDir, { recursive: true, force: true });
  await rm(".test-runtime.json", { force: true });
}
