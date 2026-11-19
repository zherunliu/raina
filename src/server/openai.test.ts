import { afterEach, describe, expect, it, vi } from "vitest";
const profiles = vi.hoisted(() => ({
  chat: {
    name: "ds-openai",
    protocol: "openai-compat",
    base_url: "https://chat.example/v1",
    api_key: "chat-test-key",
    model: "test-chat-model",
    thinking: "high",
    max_output_tokens: 128000,
    context_window: 1000000,
  },
  embedding: {
    name: "ali-openai",
    protocol: "openai-compat",
    base_url: "https://embed.example/v1",
    api_key: "embedding-test-key",
    model: "qwen3.7-text-embedding-flash",
  },
}));
vi.mock("./llm-config", () => ({ llmConfig: () => profiles }));
import { generate, embed } from "./openai";
afterEach(() => vi.unstubAllGlobals());
const signal = () => new AbortController().signal;
async function collect(iterator: AsyncGenerator<string>) {
  let text = "";
  for await (const chunk of iterator) text += chunk;
  return text;
}
function sse(events: unknown[], done = true) {
  const bytes = new TextEncoder().encode(
    events.map((event) => `data: ${JSON.stringify(event)}\r\n\r\n`).join("") +
      (done ? "data: [DONE]\r\n\r\n" : ""),
  );
  return new Response(
    new ReadableStream<Uint8Array>({
      start(output) {
        for (const byte of bytes) output.enqueue(Uint8Array.of(byte));
        output.close();
      },
    }),
    { headers: { "content-type": "text/event-stream" } },
  );
}
describe("OpenAI SDK adapter", () => {
  it("streams split UTF-8 SSE, forwards profile settings, and emits only answer text", async () => {
    const fetch = vi.fn().mockResolvedValue(
      sse([
        {
          choices: [
            {
              index: 0,
              delta: { reasoning_content: "private reasoning" },
              finish_reason: null,
            },
          ],
        },
        {
          choices: [
            {
              index: 0,
              delta: { content: "你好\nworld" },
              finish_reason: null,
            },
          ],
        },
        {
          choices: [
            { index: 0, delta: { content: "!" }, finish_reason: "stop" },
          ],
        },
      ]),
    );
    vi.stubGlobal("fetch", fetch);
    expect(
      await collect(
        generate([{ role: "user", content: "hello" }], true, signal()),
      ),
    ).toBe("你好\nworld!");
    expect(String(fetch.mock.calls[0][0])).toBe(
      "https://chat.example/v1/chat/completions",
    );
    expect(
      new Headers(fetch.mock.calls[0][1].headers).get("authorization"),
    ).toBe("Bearer chat-test-key");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
      model: "test-chat-model",
      max_tokens: 128000,
      reasoning_effort: "high",
      thinking: { type: "enabled" },
      stream: true,
    });
  });
  it("rejects truncated streams and token-limit cutoffs", async () => {
    const fetch = vi.fn().mockResolvedValue(
      sse(
        [
          {
            choices: [
              {
                index: 0,
                delta: { content: "partial" },
                finish_reason: null,
              },
            ],
          },
        ],
        false,
      ),
    );
    vi.stubGlobal("fetch", fetch);
    await expect(collect(generate([], true, signal()))).rejects.toThrow(
      "Model service unavailable",
    );
    fetch.mockResolvedValue(
      Response.json({
        choices: [{ message: { content: "cut off" }, finish_reason: "length" }],
      }),
    );
    await expect(collect(generate([], false, signal()))).rejects.toThrow(
      "Model service unavailable",
    );
  });
  it("supports JSON completions and does not retry failed model calls", async () => {
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        choices: [{ message: { content: "answer" }, finish_reason: "stop" }],
      }),
    );
    vi.stubGlobal("fetch", fetch);
    expect(await collect(generate([], false, signal()))).toBe("answer");
    fetch
      .mockClear()
      .mockResolvedValue(new Response("Unavailable", { status: 503 }));
    await expect(collect(generate([], false, signal()))).rejects.toThrow(
      "Model service unavailable",
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("uses ali-openai credentials and restores embedding index order", async () => {
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        data: [
          { index: 1, embedding: [3, 4] },
          { index: 0, embedding: [1, 2] },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetch);
    expect(await embed(["one", "two"], signal())).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(String(fetch.mock.calls[0][0])).toBe(
      "https://embed.example/v1/embeddings",
    );
    expect(
      new Headers(fetch.mock.calls[0][1].headers).get("authorization"),
    ).toBe("Bearer embedding-test-key");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      model: "qwen3.7-text-embedding-flash",
      input: ["one", "two"],
      encoding_format: "float",
    });
  });
  it("rejects missing, duplicate, and inconsistent embedding vectors", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    for (const data of [
      [],
      [
        { index: 0, embedding: [1] },
        { index: 0, embedding: [2] },
      ],
      [
        { index: 0, embedding: [1] },
        { index: 1, embedding: [2, 3] },
      ],
    ]) {
      fetch.mockResolvedValue(Response.json({ data }));
      await expect(embed(["one", "two"], signal())).rejects.toThrow(
        "Model service unavailable",
      );
    }
  });
  it("propagates cancellation to the SDK request", async () => {
    const fetch = vi.fn(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) =>
          init.signal.addEventListener(
            "abort",
            () => reject(init.signal.reason),
            { once: true },
          ),
        ),
    );
    vi.stubGlobal("fetch", fetch);
    const controller = new AbortController();
    const pending = collect(generate([], false, controller.signal));
    const assertion = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    controller.abort();
    await assertion;
  });
});
