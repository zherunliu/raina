import { afterEach, describe, expect, it } from "vitest";
import { getLocale, setLocale, tGlobal } from "./index";

afterEach(async () => {
  await setLocale("zh");
});

describe("i18n", () => {
  it("translates and interpolates in the active locale", async () => {
    expect(tGlobal("sidebar.days_ago", { days: 3 })).toBe("3天前");

    await setLocale("en");

    expect(getLocale()).toBe("en");
    expect(tGlobal("sidebar.days_ago", { days: 3 })).toBe("3 days ago");
    expect(tGlobal("chat.attached_cards_note", { cards: "The Fool" })).toBe(
      "\nAdditional info: drawn cards - The Fool",
    );
  });

  it("falls back to Chinese for unsupported locales", async () => {
    await setLocale("en");
    expect(getLocale("fr")).toBe("zh");
  });
});
