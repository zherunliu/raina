import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { streamChat, type StreamEvent } from "./index";

vi.mock("@/i18n", () => ({
  tGlobal: (key: string) => key,
  getLocale: () => "en",
}));

beforeEach(() => {
  vi.stubGlobal("localStorage", { getItem: () => "en" });
});
afterEach(() => vi.unstubAllGlobals());

function respond(body: string) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));
}

async function collect() {
  const events: StreamEvent[] = [];
  for await (const event of streamChat("Hello", "openai")) events.push(event);
  return events;
}

describe("chat stream completion", () => {
  it("completes after the server confirms persistence with done", async () => {
    respond(
      'data: {"kind":"session","session_id":"session-1"}\n\n' +
        'data: {"kind":"chunk","content":"Hello"}\n\n' +
        'data: {"kind":"done"}\n\n',
    );
    expect(await collect()).toEqual([
      { kind: "session", session_id: "session-1" },
      { kind: "chunk", content: "Hello" },
      { kind: "done" },
    ]);
  });

  it.each([
    "",
    'data: {"kind":"session","session_id":"session-1"}\n\n',
    'data: {"kind":"chunk","content":"Partial answer"}\n\n',
  ])("rejects EOF without done for body %j", async (body) => {
    respond(body);
    await expect(collect()).rejects.toThrow("chat.stream_interrupted");
  });

  it("preserves explicit server errors", async () => {
    respond('event: error\ndata: {"message":"Model unavailable"}\n\n');
    await expect(collect()).rejects.toThrow("Model unavailable");
  });
});
