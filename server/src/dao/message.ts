import { getDb } from "../db/mysql";
import type { Message } from "../model/message";

type MessageRow = Omit<Message, "is_user"> & {
  is_user: boolean | number;
};

function messages() {
  return getDb()<MessageRow>("messages");
}

function normalizeMessage(row: MessageRow): Message {
  return {
    ...row,
    is_user: Boolean(row.is_user),
  };
}

export async function getMessageBySessionId(
  sessionId: string,
): Promise<Message[]> {
  const rows = await messages()
    .where({ session_id: sessionId })
    .orderBy("created_at", "asc");
  return rows.map(normalizeMessage);
}

export async function getMessagesBySessionIds(
  sessionIds: string[],
): Promise<Message[]> {
  if (sessionIds.length === 0) return [];
  const rows = await messages()
    .whereIn("session_id", sessionIds)
    .orderBy("created_at", "asc");
  return rows.map(normalizeMessage);
}

export async function createMessage(
  message: Pick<Message, "session_id" | "username" | "content" | "is_user">,
): Promise<void> {
  await messages().insert(message);
}

export async function getAllMessages(): Promise<Message[]> {
  const rows = await messages().orderBy("created_at", "asc");
  return rows.map(normalizeMessage);
}
