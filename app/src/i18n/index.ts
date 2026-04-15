import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

export type Locale = "zh" | "en";

const STORAGE_KEY = "lang";

export function getSavedLanguage(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "zh" || saved === "en") {
    return saved;
  }
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith("zh") ? "zh" : "en";
}

export function setSavedLanguage(lang: Locale) {
  localStorage.setItem(STORAGE_KEY, lang);
}

export const i18n = createI18n({
  legacy: false,
  locale: getSavedLanguage(),
  fallbackLocale: "zh",
  messages: {
    en,
    zh,
  },
});

// For non-component code (stores, api clients) that cannot call useI18n().
export function tGlobal(key: string, params?: Record<string, unknown>): string {
  const translated = i18n.global.t(key, params ?? {});
  return typeof translated === "string" ? translated : String(translated);
}
