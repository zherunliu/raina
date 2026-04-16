import type { Request } from "express";
import { codeMessage, codeMessageKey, type Locale } from "../code";
import { Code } from "../code";

export function resolveLocale(value: string | null | undefined): Locale {
  const lang = value?.toLowerCase() ?? "";
  return lang.includes("zh") ? "zh" : "en";
}

export function detectLocale(req: Request): Locale {
  return resolveLocale(req.header("Accept-Language"));
}

export function localizedCodeMessage(code: Code, locale: Locale): string {
  return codeMessage(code, locale);
}

export function localizedCodeKey(code: Code): string {
  return codeMessageKey(code);
}
