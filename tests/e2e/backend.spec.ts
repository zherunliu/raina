import { test, expect, type APIRequestContext } from "@playwright/test";
async function account(request: APIRequestContext) {
  const email = `api-${crypto.randomUUID()}@example.com`;
  const response = await request.post("/api/auth/register", {
    data: { email, password: "password" },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).not.toHaveProperty("token");
  return email;
}
test("native API validates input, cookies, origin, and removes legacy routes", async ({
  request,
}) => {
  expect((await request.get("/api/sessions")).status()).toBe(401);
  expect(
    (
      await request.post("/api/auth/register", {
        data: { email: "invalid", password: "short" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/auth/login", {
        headers: { origin: "https://other.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  const email = await account(request);
  expect(
    (
      await request.post("/api/auth/register", {
        data: { email, password: "password" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.get("/api/v1/ai/chat/get-user-sessions-by-username")
    ).status(),
  ).toBe(404);
  await request.post("/api/auth/logout");
  expect((await request.get("/api/sessions")).status()).toBe(401);
});
test("sessions persist, enforce ownership, rename, delete, and isolate documents", async ({
  request,
  playwright,
}) => {
  await account(request);
  const sent = await request.post("/api/chat", {
    data: { question: "Persistent question", model: "openai", stream: false },
  });
  expect(sent.status()).toBe(200);
  const { session_id: id } = await sent.json();
  const ownerHistory = await (await request.get(`/api/sessions/${id}`)).json();
  expect(ownerHistory.history.map((m: { role: string }) => m.role)).toEqual([
    "user",
    "assistant",
  ]);
  expect(ownerHistory.history[0].content).toBe("Persistent question");
  const stranger = await playwright.request.newContext({
    baseURL: "http://localhost:5174",
  });
  try {
    await account(stranger);
    expect((await stranger.get(`/api/sessions/${id}`)).status()).toBe(404);
    expect(
      (
        await stranger.patch(`/api/sessions/${id}`, {
          data: { title: "Hijacked" },
        })
      ).status(),
    ).toBe(404);
    expect((await stranger.delete(`/api/sessions/${id}`)).status()).toBe(404);
    expect(
      (
        await stranger.post("/api/chat", {
          data: {
            sessionId: id,
            question: "Hijacked",
            model: "openai",
            stream: false,
          },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await request.patch(`/api/sessions/${id}`, {
          data: { title: "Renamed" },
        })
      ).status(),
    ).toBe(200);
    expect(
      (await (await request.get("/api/sessions")).json()).sessions[0].title,
    ).toBe("Renamed");
    const upload = await request.post("/api/documents", {
      multipart: {
        file: {
          name: "notes.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("The moon is silver."),
        },
      },
    });
    expect(upload.status()).toBe(200);
    const { filename } = await upload.json();
    expect((await (await stranger.get("/api/documents")).json()).files).toEqual(
      [],
    );
    expect((await stranger.delete(`/api/documents/${filename}`)).status()).toBe(
      404,
    );
    expect(
      (
        await request.post("/api/documents", {
          multipart: {
            file: {
              name: "bad.exe",
              mimeType: "text/plain",
              buffer: Buffer.from("bad"),
            },
          },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await request.post("/api/documents", {
          multipart: {
            file: {
              name: "bad.txt",
              mimeType: "text/plain",
              buffer: Buffer.from([255, 254, 253]),
            },
          },
        })
      ).status(),
    ).toBe(400);
    const rag = await request.post("/api/chat", {
      data: {
        sessionId: id,
        question: "What color is the moon?",
        model: "openai-rag",
        stream: false,
      },
    });
    expect((await rag.json()).answer).toContain("the moon is silver");
    await request.delete(`/api/documents/${filename}`);
    expect((await (await request.get("/api/documents")).json()).files).toEqual(
      [],
    );
    await request.delete(`/api/sessions/${id}`);
    expect((await request.get(`/api/sessions/${id}`)).status()).toBe(404);
    expect(
      (await (await request.get("/api/sessions")).json()).sessions,
    ).toEqual([]);
  } finally {
    await stranger.dispose();
  }
});
test("SSE errors and cancellation release locks while concurrent writes are rejected", async ({
  request,
}) => {
  await account(request);
  const failure = await request.post("/api/chat", {
    data: { question: "MODEL_ERROR", model: "openai", stream: true },
  });
  expect(failure.status()).toBe(200);
  const content = await failure.text();
  expect(content).toContain("event: error");
  expect(content).not.toContain('"kind":"done"');
  const id = JSON.parse(
    content
      .split("\n")
      .find((line) => line.startsWith("data:"))!
      .slice(6),
  ).session_id;
  // An error must release the cross-process lock, so the same conversation can be retried.
  const retried = await request.post("/api/chat", {
    data: { sessionId: id, question: "Retry", model: "openai", stream: false },
  });
  expect(retried.status()).toBe(200);
  const state = await request.storageState();
  const controller = new AbortController();
  const slow = await fetch("http://localhost:5174/api/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: state.cookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; "),
    },
    body: JSON.stringify({
      sessionId: id,
      question: "SLOW_RESPONSE",
      model: "openai",
      stream: true,
    }),
    signal: controller.signal,
  });
  const reader = slow.body!.getReader();
  await reader.read();
  await expect
    .poll(async () =>
      (await (await request.get(`/api/sessions/${id}`)).json()).history.some(
        (m: { content: string }) => m.content === "SLOW_RESPONSE",
      ),
    )
    .toBe(true);
  expect(
    (
      await request.post("/api/chat", {
        data: {
          sessionId: id,
          question: "Concurrent",
          model: "openai",
          stream: false,
        },
      })
    ).status(),
  ).toBe(409);
  expect((await request.delete(`/api/sessions/${id}`)).status()).toBe(409);
  controller.abort();
  await reader.cancel().catch(() => {});
  await expect
    .poll(async () =>
      (
        await request.post("/api/chat", {
          data: {
            sessionId: id,
            question: "After cancel",
            model: "openai",
            stream: false,
          },
        })
      ).status(),
    )
    .toBe(200);
});
