import { z } from "zod";
import { tGlobal } from "@/i18n";
import { sseData } from "./sse";
const responseSchema = z.object({
  code: z.number(),
  message: z.string().optional(),
});
const base = responseSchema.passthrough();
const sessionsSchema = responseSchema.extend({
  sessions: z.array(z.object({ id: z.string(), title: z.string() })),
});
const historySchema = responseSchema.extend({
  history: z.array(
    z.object({
      id: z.coerce.string(),
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
});
const chatSchema = responseSchema.extend({
  session_id: z.string().optional(),
  answer: z.string().optional(),
});
const filesSchema = responseSchema.extend({ files: z.array(z.string()) });
export type ModelType = "openai" | "openai-rag";
export type BaseResponse = z.infer<typeof responseSchema>;
export type StreamEvent =
  | { kind: "session"; session_id: string }
  | { kind: "chunk"; content: string }
  | { kind: "done" };
async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("accept-language", localStorage.getItem("lang") || "zh");
  if (init.body && !(init.body instanceof FormData))
    headers.set("content-type", "application/json");
  const response = await fetch(`/api${path}`, { ...init, headers });
  if (response.status === 401 && !path.startsWith("/auth/"))
    window.location.assign("/login");
  if (!response.ok) {
    const parsed = responseSchema.safeParse(
      await response.json().catch(() => null),
    );
    throw new Error(
      parsed.success ? parsed.data.message : tGlobal("common.network_error"),
    );
  }
  return response;
}
async function api<T>(path: string, init: RequestInit, schema: z.ZodType<T>) {
  const response = await request(path, init);
  const data = schema.parse(await response.json());
  const result = responseSchema.parse(data);
  if (result.code !== 1000)
    throw new Error(result.message || tGlobal("common.network_error"));
  return data;
}
export const loginApi = (username: string, password: string) =>
  api(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ username, password }) },
    base,
  );
export const registerApi = (email: string, password: string) =>
  api(
    "/auth/register",
    { method: "POST", body: JSON.stringify({ email, password }) },
    base,
  );
export const getSessionsApi = () => api("/sessions", {}, sessionsSchema);
export const getChatHistoryApi = (id: string) =>
  api(`/sessions/${id}`, {}, historySchema);
export function sendChat(
  question: string,
  model: ModelType,
  sessionId?: string,
  signal?: AbortSignal,
) {
  return api(
    "/chat",
    {
      method: "POST",
      body: JSON.stringify({ question, model, sessionId, stream: false }),
      signal,
    },
    chatSchema,
  );
}
const eventSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("session"), session_id: z.string() }),
  z.object({ kind: z.literal("chunk"), content: z.string() }),
  z.object({ kind: z.literal("done") }),
]);
export async function* streamChat(
  question: string,
  model: ModelType,
  sessionId?: string,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const response = await request("/chat", {
    method: "POST",
    body: JSON.stringify({ question, model, sessionId, stream: true }),
    signal,
  });
  if (!response.body) throw new Error(tGlobal("common.network_error"));
  for await (const payload of sseData(response.body)) {
    const event = eventSchema.parse(JSON.parse(payload));
    yield event;
    if (event.kind === "done") return;
  }
}
export function uploadFileApi(file: File) {
  const body = new FormData();
  body.append("file", file);
  return api("/documents", { method: "POST", body }, base);
}
export const tarotDailyApi = (message: string) =>
  api(
    "/tarot/daily",
    { method: "POST", body: JSON.stringify({ message }) },
    chatSchema,
  );
export const renameSessionApi = (id: string, title: string) =>
  api(
    `/sessions/${id}`,
    { method: "PATCH", body: JSON.stringify({ title }) },
    base,
  );
export const deleteSessionApi = (id: string) =>
  api(`/sessions/${id}`, { method: "DELETE" }, base);
export const listFilesApi = () => api("/documents", {}, filesSchema);
export const deleteFileApi = (filename: string) =>
  api(`/documents/${encodeURIComponent(filename)}`, { method: "DELETE" }, base);
