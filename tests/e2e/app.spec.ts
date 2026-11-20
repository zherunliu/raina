import { test, expect } from "@playwright/test";

test("SSR guards, registration validation, and safe redirects", async ({
  page,
  request,
}) => {
  const response = await request.get("/explore", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toContain("/login");
  const html = await request.get("/login");
  expect(await html.text()).toContain("登录后使用聊天");
  const email = `register-${crypto.randomUUID()}@example.com`;
  await page.goto("/login?redirect=//evil.example");
  await page.getByRole("link", { name: "去注册" }).click();
  await page.getByRole("textbox", { name: "邮箱", exact: true }).fill(email);
  await page.getByLabel("密码", { exact: true }).fill("password");
  await page.getByLabel("确认密码", { exact: true }).fill("different");
  await page.getByRole("button", { name: "注册", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("两次输入的密码不一致");
  await page.getByLabel("确认密码", { exact: true }).fill("password");
  await page.getByRole("button", { name: "注册", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:5174/");
  await expect(
    page.getByRole("heading", { name: "你好，今天感觉怎么样？" }),
  ).toBeVisible();
});

test("chat, cards, settings, uploads, and logout work after hydration", async ({
  page,
  context,
  request,
}) => {
  const email = `reader-${crypto.randomUUID()}@example.com`;
  await request.post("/api/auth/register", {
    data: { email, password: "password" },
  });
  await context.clearCookies();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("用户名").fill(email);
  await page.getByLabel("密码", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("密码错误");
  await page.getByLabel("密码", { exact: true }).fill("password");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:5174/");
  const cookie = (await context.cookies()).find(
    (cookie) => cookie.name === "raina_session",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  await page
    .getByRole("textbox", { name: "输入您的问题..." })
    .fill("First question");
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Hello reader");
  await expect(
    page.getByRole("log").getByText("First question", { exact: true }),
  ).toHaveCount(1);
  await page.getByLabel("流式", { exact: true }).uncheck();
  await page
    .getByRole("textbox", { name: "输入您的问题..." })
    .fill("Second question");
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(
    page.getByRole("log").getByText("Hello reader", { exact: true }),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "上传文档" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("notes"),
  });
  await expect(page.getByText("文档已上传")).toBeVisible();
  await page.getByRole("button", { name: "选择牌阵", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "开始抽牌" }).click();
  await dialog.getByRole("button", { name: "全部翻开" }).click();
  await expect(dialog.locator('img[src^="/tarot/"]')).toHaveCount(3);
  await dialog.getByRole("button", { name: "加入对话" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "清除", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "今日运势", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "点击翻牌" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "A new perspective awaits.",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "探索牌义" }).click();
  await expect(page.getByRole("heading", { name: "塔罗图鉴" })).toBeVisible();
  await expect(page.locator('button img[src^="/tarot/"]')).toHaveCount(78);
  const search = page.getByRole("textbox", { name: "搜索牌名或关键词..." });
  await search.fill("The Fool");
  await expect(page.locator('button img[src^="/tarot/"]')).toHaveCount(1);
  await page.locator('button img[src^="/tarot/"]').click();
  await expect(page.getByRole("dialog")).toContainText("正位");
  expect(
    await page
      .getByRole("dialog")
      .locator("img")
      .evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "切换主题" }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tarot Encyclopedia" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveClass("dark");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/explore-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login/);
  expect(
    (await context.cookies()).find((cookie) => cookie.name === "raina_session"),
  ).toBeUndefined();
  expect(errors).toEqual([]);
});
