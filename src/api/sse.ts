/** Incremental SSE decoder: network chunks need not align with events or UTF-8 characters. */
export async function* sseData(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  function parse(frame: string) {
    const lines = frame.split(/\r?\n/);
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""))
      .join("\n");
    if (lines.some((line) => line === "event: error")) {
      let message = data;
      try {
        message = JSON.parse(data).message || data;
      } catch {
        /* plain-text error */
      }
      throw new Error(message);
    }
    return lines.some((line) => line.startsWith("data:")) ? data : undefined;
  }
  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const frame = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const payload = parse(frame);
        if (payload !== undefined) yield payload;
      }
      if (done) {
        if (buffer) {
          const payload = parse(buffer);
          if (payload !== undefined) yield payload;
        }
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
