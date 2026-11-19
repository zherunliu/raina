// Real production app + real MySQL/Redis. Only the OpenAI-compatible HTTP protocol is a fixture.
import "dotenv/config";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { createConnection } from "mysql2/promise";
import Redis from "ioredis";
import { setupDatabase, closeDatabase } from "../src/server/db";
import { config } from "../src/server/config";
const database = `raina_e2e_${process.pid}`;
process.env.MYSQL_DB = database;
process.env.JWT_KEY = randomBytes(32).toString("hex");
process.env.DATA_DIR = await mkdtemp(join(tmpdir(), "raina-e2e-"));
process.env.YUKINO_CONFIG_PATH = join(process.env.DATA_DIR!, "models.yaml");
await writeFile(
  process.env.YUKINO_CONFIG_PATH,
  JSON.stringify({
    providers: [
      {
        name: "ds-openai",
        protocol: "openai-compat",
        base_url: "http://127.0.0.1:11435/chat/v1",
        api_key: "test-chat-key",
        model: "test-chat",
        thinking: "high",
        max_output_tokens: 128000,
        context_window: 1000000,
      },
      {
        name: "ali-openai",
        protocol: "openai-compat",
        base_url: "http://127.0.0.1:11435/embed/v1",
        api_key: "test-embedding-key",
        model: "unused-chat-model",
      },
    ],
  }),
);
await writeFile(
  ".test-runtime.json",
  JSON.stringify({ database, dataDir: process.env.DATA_DIR }),
);
const model = createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw || "{}");
  if (req.url === "/embed/v1/embeddings") {
    if (
      req.headers.authorization !== "Bearer test-embedding-key" ||
      body.model !== "qwen3.7-text-embedding-flash"
    ) {
      res.writeHead(400);
      res.end();
      return;
    }
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        object: "list",
        data: body.input.map((text: string, index: number) => ({
          object: "embedding",
          index,
          embedding: [
            text.toLowerCase().includes("moon") ? 1 : 0,
            text.toLowerCase().includes("sun") ? 1 : 0,
            0.1,
          ],
        })),
      }),
    );
    return;
  }
  if (
    req.url !== "/chat/v1/chat/completions" ||
    req.headers.authorization !== "Bearer test-chat-key" ||
    body.model !== "test-chat" ||
    body.max_tokens !== 128000 ||
    body.reasoning_effort !== "high" ||
    body.thinking?.type !== "enabled"
  ) {
    res.writeHead(400);
    res.end();
    return;
  }
  const question = body.messages?.at(-1)?.content || "";
  if (question.includes("MODEL_ERROR")) {
    res.writeHead(503);
    res.end();
    return;
  }
  const answer = body.messages?.[0]?.content.includes("daily reading")
    ? "A new perspective awaits."
    : question.includes("<documents>")
      ? "From documents: the moon is silver."
      : "Hello **reader**";
  if (!body.stream) {
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        id: "completion",
        object: "chat.completion",
        model: body.model,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: answer },
            finish_reason: "stop",
          },
        ],
      }),
    );
    return;
  }
  res.writeHead(200, { "content-type": "text/event-stream" });
  res.write(
    `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: answer.slice(0, 6) }, finish_reason: null }] })}\n\n`,
  );
  const timer = setTimeout(
    () => {
      res.write(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta: { content: answer.slice(6) }, finish_reason: "stop" }] })}\n\n`,
      );
      res.end("data: [DONE]\n\n");
    },
    question.includes("SLOW_RESPONSE") ? 10_000 : 80,
  );
  res.on("close", () => clearTimeout(timer));
});

let child: ReturnType<typeof spawn> | undefined;
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  if (child && child.exitCode === null && child.signalCode === null) {
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    await exited;
  }
  model.closeAllConnections();
  model.close();
  await closeDatabase();
  const c = config();
  const connection = await createConnection({
    host: c.MYSQL_HOST,
    port: c.MYSQL_PORT,
    user: c.MYSQL_USER,
    password: c.MYSQL_PASSWORD,
  });
  try {
    await connection.query("DROP DATABASE IF EXISTS `" + database + "`");
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
          `raina:${database}:*`,
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
  await rm(process.env.DATA_DIR!, { recursive: true, force: true });
}
process.once("SIGTERM", () => void stop());
process.once("SIGINT", () => void stop());
try {
  await setupDatabase();
  await closeDatabase();
  model.listen(11435, "127.0.0.1");
  await once(model, "listening");
  child = spawn(process.execPath, [".output/server/index.mjs"], {
    env: { ...process.env, PORT: "5174" },
    stdio: "inherit",
  });
  const [code] = await once(child, "exit");
  await stop();
  process.exitCode = Number(code) || 0;
} catch (error) {
  console.error(error);
  await stop();
  process.exitCode = 1;
}
