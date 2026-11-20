import { z } from "zod";
import { endpoint, json, localeOf, readJson, readBytes } from "./http";
import { register, login, setSession, clearSession } from "./auth";
import { query, execute, type SessionRow } from "./db";
import { AppError, Code, codeMessage } from "./errors";
import {
  listDocuments,
  saveDocument,
  deleteDocument,
  MAX_FILE_BYTES,
} from "./documents";
import {
  prepareChat,
  chatEvents,
  history,
  ownedSession,
  deleteSession,
  daily,
} from "./chat";
export const signUp = endpoint(async (request) => {
  const body = await readJson(
    request,
    z.object({
      email: z.email().max(128),
      password: z.string().min(8).max(256),
    }),
  );
  const user = await register(body.email, body.password);
  setSession(user, request);
  return json(request);
}, false);
export const signIn = endpoint(async (request) => {
  const body = await readJson(
    request,
    z.object({
      username: z.email().max(128),
      password: z.string().min(1).max(256),
    }),
  );
  const user = await login(body.username, body.password);
  setSession(user, request);
  return json(request);
}, false);
export const signOut = endpoint(async (request) => {
  clearSession();
  return json(request);
}, false);
export const sessions = endpoint(async (request, user) =>
  json(request, {
    sessions: await query<SessionRow>(
      "SELECT id, title FROM sessions WHERE user_id = ? ORDER BY updated_at DESC, id",
      [user!.id],
    ),
  }),
);
const sessionIdOf = (request: Request) =>
  z.uuid().parse(new URL(request.url).pathname.split("/").at(-1));
export const sessionHistory = endpoint(async (request, user) =>
  json(request, { history: await history(user!.id, sessionIdOf(request)) }),
);
export const removeSession = endpoint(async (request, user) => {
  await deleteSession(user!.id, sessionIdOf(request));
  return json(request);
});
export const renameSession = endpoint(async (request, user) => {
  const id = sessionIdOf(request);
  await ownedSession(user!.id, id);
  const { title } = await readJson(
    request,
    z.object({ title: z.string().trim().min(1).max(128) }),
  );
  await execute(
    "UPDATE sessions SET title = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND user_id = ?",
    [title, id, user!.id],
  );
  return json(request);
});
export const documents = endpoint(async (request, user) =>
  json(request, { files: await listDocuments(user!.id) }),
);
export const uploadDocument = endpoint(async (request, user) => {
  const limit = MAX_FILE_BYTES + 16 * 1024;
  if (
    !request.headers.get("content-type")?.startsWith("multipart/form-data") ||
    Number(request.headers.get("content-length")) > limit
  )
    throw new AppError(Code.ParamsInvalid, 413);
  const bytes = await readBytes(request, limit);
  let form: FormData;
  try {
    form = await new Response(bytes, {
      headers: { "content-type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    throw new AppError(Code.ParamsInvalid);
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new AppError(Code.ParamsInvalid);
  return json(request, { filename: await saveDocument(user!.id, file) });
});
export const removeDocument = endpoint(async (request, user) => {
  const filename = decodeURIComponent(
    new URL(request.url).pathname.split("/").at(-1)!,
  );
  await deleteDocument(user!.id, filename);
  return json(request);
});
export const tarotDaily = endpoint(async (request) => {
  const { message } = await readJson(
    request,
    z.object({ message: z.string().trim().min(1).max(32_000) }),
  );
  try {
    return json(request, {
      answer: await daily(
        message,
        localeOf(request),
        AbortSignal.any([request.signal, AbortSignal.timeout(120_000)]),
      ),
    });
  } catch (error) {
    if (request.signal.aborted) throw error;
    throw new AppError(Code.ModelError, 502);
  }
});
export const chat = endpoint(async (request, user) => {
  const body = await readJson(
    request,
    z.object({
      sessionId: z.uuid().optional(),
      question: z.string().trim().min(1).max(32_000),
      model: z.enum(["openai", "openai-rag"]),
      stream: z.boolean().default(true),
    }),
  );
  const prepared = await prepareChat(user!.id, body.question, body.sessionId);
  const controller = new AbortController();
  const signal = AbortSignal.any([
    request.signal,
    controller.signal,
    AbortSignal.timeout(120_000),
  ]);
  const events = chatEvents(
    user!.id,
    body.question,
    body.model,
    prepared,
    body.stream,
    localeOf(request),
    signal,
  );
  if (!body.stream) {
    let answer = "";
    try {
      for await (const event of events)
        if (event.kind === "chunk") answer = event.content;
    } catch (error) {
      if (request.signal.aborted) throw error;
      if (error instanceof AppError) throw error;
      throw new AppError(Code.ModelError, 502);
    }
    return json(request, { session_id: prepared.id, answer });
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(output) {
      try {
        const event = await events.next();
        if (event.done) {
          output.close();
          return;
        }
        output.enqueue(
          encoder.encode(`data: ${JSON.stringify(event.value)}\n\n`),
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!signal.aborted || !request.signal.aborted) {
          const code = error instanceof AppError ? error.code : Code.ModelError;
          output.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ code, message: codeMessage(code, localeOf(request)) })}\n\n`,
            ),
          );
        }
        output.close();
      }
    },
    async cancel() {
      controller.abort();
      try {
        await events.return(undefined);
      } finally {
        await prepared.release();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
});
