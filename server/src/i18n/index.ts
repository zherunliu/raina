import type { Request } from "express";
import { codeMessage, codeMessageKey, type Locale } from "../code";
import { Code } from "../code";

export function detectLocale(req: Request): Locale {
  const lang = req.header("Accept-Language")?.toLowerCase() ?? "";
  return lang.includes("zh") ? "zh" : "en";
}

export function localizedCodeMessage(code: Code, locale: Locale): string {
  return codeMessage(code, locale);
}

export function localizedCodeKey(code: Code): string {
  return codeMessageKey(code);
}
