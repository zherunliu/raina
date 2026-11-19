import { z } from "zod";
import { AppError, Code, codeMessage, type Locale } from "./errors";
import { currentUser, clearSession } from "./auth";
import type { UserRow } from "./db";
export const localeOf = (request: Request): Locale =>
  request.headers.get("accept-language")?.toLowerCase().includes("zh")
    ? "zh"
    : "en";
export function json(
  request: Request,
  extra: Record<string, unknown> = {},
  code = Code.OK,
  status = 200,
) {
  return Response.json(
    { code, message: codeMessage(code, localeOf(request)), ...extra },
    { status, headers: { "cache-control": "no-store" } },
  );
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (
    request.method !== "GET" &&
    origin &&
    origin !== new URL(request.url).origin
  )
    throw new AppError(Code.Forbidden, 403);
}
export function endpoint(
  handler: (request: Request, user: UserRow | null) => Promise<Response>,
  authenticated = true,
) {
  return async ({ request }: { request: Request }) => {
    try {
      checkOrigin(request);
      const user = authenticated ? await currentUser() : null;
      if (authenticated && !user) {
        clearSession();
        throw new AppError(Code.TokenInvalid, 401);
      }
      return await handler(request, user);
    } catch (error) {
      if (request.signal.aborted) throw error;
      if (error instanceof AppError)
        return json(request, {}, error.code, error.status);
      if (error instanceof z.ZodError || error instanceof SyntaxError)
        return json(request, {}, Code.ParamsInvalid, 400);
      console.error("Request failed", error);
      return json(request, {}, Code.ServerError, 500);
    }
  };
}
export async function readJson<T>(request: Request, schema: z.ZodType<T>) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new AppError(Code.ParamsInvalid, 415);
  if (Number(request.headers.get("content-length")) > 128 * 1024)
    throw new AppError(Code.ParamsInvalid, 413);
  // Limit actual bytes as well as declared size.
  const body = await readBytes(request, 128 * 1024);
  return schema.parse(JSON.parse(new TextDecoder().decode(body)));
}
export async function readBytes(request: Request, limit: number) {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) throw new AppError(Code.ParamsInvalid, 413);
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
