import { z } from "zod";
import { tGlobal } from "../i18n";

const BaseResponseSchema = z.looseObject({
  code: z.number(),
  message: z.string().optional(),
});

const BoolLikeSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === 1 || value === "1") {
    return true;
  }
  if (value === 0 || value === "0") {
    return false;
  }
  return value;
}, z.boolean());

const LoginResponseSchema = BaseResponseSchema.extend({
  token: z.string().optional(),
  username: z.string().optional(),
});

const SessionsResponseSchema = BaseResponseSchema.extend({
  sessions: z
    .array(z.object({ id: z.string(), title: z.string().optional() }))
    .optional(),
});

const HistoryResponseSchema = BaseResponseSchema.extend({
  history: z
    .array(z.object({ is_user: BoolLikeSchema, content: z.string() }))
    .optional(),
});

const ChatResponseSchema = BaseResponseSchema.extend({
  session_id: z.string().optional(),
  answer: z.string().optional(),
});

const FilesResponseSchema = BaseResponseSchema.extend({
  files: z.array(z.string()).optional(),
});

export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type SessionsResponse = z.infer<typeof SessionsResponseSchema>;
export type HistoryResponse = z.infer<typeof HistoryResponseSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export type ModelType = "ollama" | "ollama-rag";

function getToken(): string {
  return localStorage.getItem("token") ?? "";
}

function getLang(): string {
  return localStorage.getItem("lang") ?? "zh";
}

async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
  schema: z.ZodType<T>,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (init.auth !== false) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  headers.set("Accept-Language", getLang());
  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
  });
  const ct = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    if (ct.includes("application/json")) {
      const data: unknown = await res.json();
      const parsed = BaseResponseSchema.safeParse(data);
      throw new Error(
        parsed.success
          ? (parsed.data.message ?? tGlobal("common.network_error"))
          : tGlobal("common.network_error"),
      );
    }
    throw new Error(tGlobal("common.network_error"));
  }
  if (ct.includes("application/json")) {
    const data: unknown = await res.json();
    return schema.parse(data);
  }
  // Non-json response is not expected in our API; keep it for compatibility.
  const text = await res.text();
  return schema.parse(text as unknown);
}

export function loginApi(
  username: string,
  password: string,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>(
    "/user/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
      auth: false,
    },
    LoginResponseSchema,
  );
}

export function registerApi(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>(
    "/user/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    },
    LoginResponseSchema,
  );
}

export function getSessionsApi(): Promise<SessionsResponse> {
  return apiFetch<SessionsResponse>(
    "/ai/chat/get-user-sessions-by-username",
    {
      method: "GET",
    },
    SessionsResponseSchema,
  );
}

export function getChatHistoryApi(
  session_id: string,
): Promise<HistoryResponse> {
  return apiFetch<HistoryResponse>(
    "/ai/chat/get-chat-history-list",
    {
      method: "POST",
      body: JSON.stringify({ session_id }),
    },
    HistoryResponseSchema,
  );
}

export function createSessionAndSendMessage(
  question: string,
  model_type: ModelType,
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>(
    "/ai/chat/create-session-and-send-message",
    {
      method: "POST",
      body: JSON.stringify({ question, model_type }),
    },
    ChatResponseSchema,
  );
}

export function sendMessage2Session(
  session_id: string,
  question: string,
  model_type: ModelType,
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>(
    "/ai/chat/send-message-2-session",
    {
      method: "POST",
      body: JSON.stringify({ session_id, question, model_type }),
    },
    ChatResponseSchema,
  );
}

export type StreamEvent =
  | { kind: "session"; session_id: string }
  | { kind: "chunk"; content: string }
  | { kind: "done" };

async function* sseStream(path: string, body: object): AsyncGenerator<string> {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      "Accept-Language": getLang(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    throw new Error(tGlobal("common.network_error"));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const fullEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        // We only care about "data:" lines (SSE may contain "event:" etc)
        const lines = fullEvent.split("\n");
        for (const rawLine of lines) {
          const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
          if (!line.startsWith("data:")) continue;
          let payload = line.slice(5);
          if (payload.startsWith(" ")) payload = payload.slice(1);
          yield payload;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* createSessionAndSendMessageStream(
  question: string,
  model_type: ModelType,
): AsyncGenerator<StreamEvent> {
  let full = "";
  for await (const payload of sseStream(
    "/ai/chat/create-session-and-send-message-stream",
    {
      question,
      model_type,
    },
  )) {
    if (payload === "[DONE]") {
      yield { kind: "done" };
      return;
    }
    if (payload.startsWith("{")) {
      try {
        const obj: unknown = JSON.parse(payload);
        const parsed = z.object({ session_id: z.string() }).safeParse(obj);
        if (parsed.success) {
          yield { kind: "session", session_id: parsed.data.session_id };
          continue;
        }
      } catch {
        // fall through
      }
    }
    full += payload;
    yield { kind: "chunk", content: full };
  }
}

export async function* sendMessageStream2Session(
  session_id: string,
  question: string,
  model_type: ModelType,
): AsyncGenerator<StreamEvent> {
  let full = "";
  for await (const payload of sseStream(
    "/ai/chat/send-message-stream-2-session",
    {
      session_id,
      question,
      model_type,
    },
  )) {
    if (payload === "[DONE]") {
      yield { kind: "done" };
      return;
    }
    full += payload;
    yield { kind: "chunk", content: full };
  }
}

export function uploadFileApi(file: File): Promise<BaseResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<BaseResponse>(
    "/file/upload",
    {
      method: "POST",
      body: form,
    },
    BaseResponseSchema,
  );
}

export function tarotDailyApi(message: string): Promise<ChatResponse> {
  return apiFetch<ChatResponse>(
    "/ai/tarot/daily",
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
    ChatResponseSchema,
  );
}

export function renameSessionApi(
  session_id: string,
  title: string,
): Promise<BaseResponse> {
  return apiFetch<BaseResponse>(
    "/ai/chat/rename-session",
    {
      method: "POST",
      body: JSON.stringify({ session_id, title }),
    },
    BaseResponseSchema,
  );
}

export function deleteSessionApi(session_id: string): Promise<BaseResponse> {
  return apiFetch<BaseResponse>(
    "/ai/chat/delete-session",
    {
      method: "POST",
      body: JSON.stringify({ session_id }),
    },
    BaseResponseSchema,
  );
}

export function listFilesApi(): Promise<z.infer<typeof FilesResponseSchema>> {
  return apiFetch("/file/list", { method: "GET" }, FilesResponseSchema);
}

export function deleteFileApi(filename: string): Promise<BaseResponse> {
  return apiFetch<BaseResponse>(
    "/file/delete",
    { method: "POST", body: JSON.stringify({ filename }) },
    BaseResponseSchema,
  );
}
