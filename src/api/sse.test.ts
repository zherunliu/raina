import { describe, expect, it } from "vitest";
import { sseData } from "./sse";
function stream(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}
async function collect(body: ReadableStream<Uint8Array>) {
  const result: string[] = [];
  for await (const data of sseData(body)) result.push(data);
  return result;
}
describe("SSE decoding", () => {
  it("preserves UTF-8 across network boundaries, CRLF, multiline data, comments, and EOF", async () => {
    const bytes = new TextEncoder().encode(
      ": heartbeat\r\n\r\ndata: 你好\r\ndata: world\r\n\r\ndata: final",
    );
    expect(
      await collect(stream(Array.from(bytes, (byte) => Uint8Array.of(byte)))),
    ).toEqual(["你好\nworld", "final"]);
  });
  it("raises server error events instead of rendering them as an answer", async () => {
    await expect(
      collect(
        stream([
          new TextEncoder().encode(
            'event: error\ndata: {"code":1002,"message":"Model unavailable"}\n\n',
          ),
        ]),
      ),
    ).rejects.toThrow("Model unavailable");
  });
  it("cancels the network reader when the consumer stops at DONE", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      },
      cancel() {
        cancelled = true;
      },
    });
    for await (const data of sseData(body)) {
      expect(data).toBe("[DONE]");
      break;
    }
    expect(cancelled).toBe(true);
  });
});
