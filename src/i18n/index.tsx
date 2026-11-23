import { useEffect, type ReactNode } from "react";
import i18n, { type TOptions } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

export type Locale = "zh" | "en";

const defaultLocale: Locale = "zh";

void i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  supportedLngs: ["zh", "en"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export function getLocale(language = i18n.resolvedLanguage): Locale {
  return language?.startsWith("en") ? "en" : "zh";
}

function storedLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  return localStorage.getItem("lang") === "en" ? "en" : "zh";
}

export function setLocale(locale: Locale) {
  if (typeof window !== "undefined") localStorage.setItem("lang", locale);
  return i18n.changeLanguage(locale);
}

export function tGlobal(key: string, params: TOptions = {}): string {
  return i18n.t(key, params);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void i18n.changeLanguage(storedLocale());
  }, []);
  useEffect(() => {
    const apply = (language: string) => {
      document.documentElement.lang = getLocale(language);
    };
    apply(i18n.resolvedLanguage ?? i18n.language);
    i18n.on("languageChanged", apply);
    return () => i18n.off("languageChanged", apply);
  }, []);
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
