import { getDb } from "../db/mysql";
import type { Session } from "../model/session";

function sessions() {
  return getDb()<Session>("sessions");
}

export async function createSession(
  session: Pick<Session, "id" | "username" | "title">,
): Promise<void> {
  await sessions().insert(session);
}

export async function getSessionById(
  sessionId: string,
): Promise<Session | null> {
  const row = await sessions()
    .where({ id: sessionId })
    .whereNull("deleted_at")
    .first();
  return row ?? null;
}

export async function getSessionByUsername(
  username: string,
): Promise<Session[]> {
  return sessions().where({ username }).whereNull("deleted_at");
}

export async function updateSessionTitle(
  username: string,
  sessionId: string,
  title: string,
): Promise<number> {
  return sessions()
    .where({ id: sessionId, username })
    .whereNull("deleted_at")
    .update({ title, updated_at: getDb().fn.now() });
}

export async function softDeleteSession(
  username: string,
  sessionId: string,
): Promise<number> {
  return sessions()
    .where({ id: sessionId, username })
    .whereNull("deleted_at")
    .update({ deleted_at: getDb().fn.now(), updated_at: getDb().fn.now() });
}
