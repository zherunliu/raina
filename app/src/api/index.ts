const ChatApi = {
  chat: "/chat/sync",
  chatStream: "/chat",
} as const;

export async function* chatStreamApi(message: string): AsyncGenerator<string> {
  const response = await fetch(
    `${import.meta.env.VITE_SERVER_URL}${ChatApi.chatStream}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    },
  );

  if (!response.ok || !response.body) {
    throw new Error("网络请求失败");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let eventBoundary;
      while ((eventBoundary = buffer.indexOf("\n\n")) !== -1) {
        const fullEvent = buffer.slice(0, eventBoundary);
        buffer = buffer.slice(eventBoundary + 2);

        if (fullEvent.startsWith("data:")) {
          const rawData = fullEvent.replace(/^data:\s*/, "");
          if (rawData === "[DONE]") return;
          const parsed = JSON.parse(rawData);
          yield parsed.content;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function chatApi(message: string): Promise<string> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SERVER_URL}${ChatApi.chat}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      },
    );

    if (!response.ok || !response.body) {
      throw new Error("网络请求失败");
    }
    const data = await response.text();
    return data;
  } catch (error) {
    console.error("请求失败:", error);
    throw new Error(error instanceof Error ? error.message : "未知错误");
  }
}
