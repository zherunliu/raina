import { randomUUID } from "node:crypto";
import {
  query,
  execute,
  transaction,
  type SessionRow,
  type MessageRow,
} from "./db";
import { cache } from "./runtime";
import { config } from "./config";
import { AppError, Code, type Locale } from "./errors";
import { generate, type ModelMessage } from "./openai";
import { retrievalPrompt } from "./rag";
export type ModelType = "openai" | "openai-rag";
export type ChatEvent =
  | { kind: "session"; session_id: string }
  | { kind: "chunk"; content: string }
  | { kind: "done" };
const localLocks = new Map<string, string>();
export async function ownedSession(userId: string, id: string) {
  const session = (
    await query<SessionRow>(
      "SELECT * FROM sessions WHERE id = ? AND user_id = ?",
      [id, userId],
    )
  )[0];
  if (!session) throw new AppError(Code.RecordNotFound, 404);
  return session;
}
export async function history(userId: string, id: string) {
  await ownedSession(userId, id);
  return query<MessageRow>(
    "SELECT id, role, content FROM messages WHERE session_id = ? ORDER BY id",
    [id],
  );
}
async function acquire(id: string) {
  const redis = cache();
  const key = `raina:${config().MYSQL_DB}:lock:${id}`;
  const token = randomUUID();
  if (redis) {
    if (!(await redis.set(key, token, "EX", 180, "NX")))
      throw new AppError(Code.Forbidden, 409);
  } else {
    if (localLocks.has(id)) throw new AppError(Code.Forbidden, 409);
    localLocks.set(id, token);
  }
  return async () => {
    if (redis)
      await redis.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        1,
        key,
        token,
      );
    else if (localLocks.get(id) === token) localLocks.delete(id);
  };
}
const prompts: Record<Locale, string> = {
  zh: "你叫 Raina，是一位具备心理学背景的塔罗咨询师。没有牌时自然聊天；有牌时将牌义作为心理隐喻，引导自我觉察，避免绝对化预测。不使用 emoji。",
  en: "You are Raina, a tarot reader with a psychology background. Chat naturally without cards; use cards as metaphors for reflection, avoid absolute predictions. No emoji.",
};
export async function prepareChat(
  userId: string,
  question: string,
  sessionId?: string,
) {
  const id = sessionId || randomUUID();
  if (sessionId) await ownedSession(userId, id);
  else
    await execute(
      "INSERT INTO sessions (id, user_id, title) VALUES (?, ?, ?)",
      [id, userId, question.slice(0, 128)],
    );
  const release = await acquire(id);
  return { id, release };
}
export async function* chatEvents(
  userId: string,
  question: string,
  model: ModelType,
  prepared: Awaited<ReturnType<typeof prepareChat>>,
  streaming: boolean,
  locale: Locale,
  signal: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const { id, release } = prepared;
  try {
    signal.throwIfAborted();
    yield { kind: "session", session_id: id };
    const previous = await history(userId, id);
    await execute(
      "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
      [id, "user", question],
    );
    const prompt =
      model === "openai-rag"
        ? await retrievalPrompt(userId, question, signal)
        : question;
    const messages: ModelMessage[] = [
      { role: "system", content: prompts[locale] },
      ...previous.map(({ role, content }) => ({ role, content })),
      { role: "user", content: prompt },
    ];
    let answer = "";
    for await (const text of generate(messages, streaming, signal)) {
      answer += text;
      yield { kind: "chunk", content: answer };
    }
    signal.throwIfAborted();
    await transaction(async (connection) => {
      // Deleting a session also acquires this lock, so persistence and cascade deletion cannot race.
      await connection.execute(
        "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
        [id, "assistant", answer],
      );
      await connection.execute(
        "UPDATE sessions SET updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND user_id = ?",
        [id, userId],
      );
    });
    yield { kind: "done" };
  } finally {
    await release();
  }
}
export async function deleteSession(userId: string, id: string) {
  await ownedSession(userId, id);
  const release = await acquire(id);
  try {
    await execute("DELETE FROM sessions WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);
  } finally {
    await release();
  }
}
export async function daily(
  message: string,
  locale: Locale,
  signal: AbortSignal,
) {
  let answer = "";
  for await (const chunk of generate(
    [
      {
        role: "system",
        content:
          prompts[locale] + " Give a concise daily reading. No markdown.",
      },
      { role: "user", content: message },
    ],
    false,
    signal,
  ))
    answer += chunk;
  return answer;
}
