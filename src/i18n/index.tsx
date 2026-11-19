import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
export type Locale = "zh" | "en";
export function translate(
  locale: Locale,
  key: string,
  params: Record<string, unknown> = {},
) {
  let value: unknown = locale === "en" ? en : zh;
  for (const part of key.split("."))
    value =
      value && typeof value === "object"
        ? (value as Record<string, unknown>)[part]
        : undefined;
  return (typeof value === "string" ? value : key).replace(
    /\{(\w+)\}/g,
    (_, name) => String(params[name] ?? `{${name}}`),
  );
}
export function tGlobal(key: string, params?: Record<string, unknown>) {
  return translate(
    typeof window !== "undefined" && localStorage.getItem("lang") === "en"
      ? "en"
      : "zh",
    key,
    params,
  );
}
const I18nContext = createContext({
  locale: "zh" as Locale,
  setLocale: (value: Locale) => {
    void value;
  },
  t: (key: string, params?: Record<string, unknown>) =>
    translate("zh", key, params),
});
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLanguage] = useState<Locale>("zh");
  useEffect(() => {
    setLanguage(localStorage.getItem("lang") === "en" ? "en" : "zh");
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  function setLocale(value: Locale) {
    setLanguage(value);
    localStorage.setItem("lang", value);
  }
  return (
    <I18nContext
      value={{
        locale,
        setLocale,
        t: (key, params) => translate(locale, key, params),
      }}
    >
      {children}
    </I18nContext>
  );
}
export function useI18n() {
  return useContext(I18nContext);
}
