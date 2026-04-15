import { Code } from "../code";
import { localizedCodeKey, localizedCodeMessage } from "../i18n";
import type { Locale } from "../code";

export interface ResponseBody {
  code: Code;
  message?: string;
  message_key?: string;
  [key: string]: unknown;
}

export function codeOf(code: Code, locale: Locale = "zh"): ResponseBody {
  return {
    code,
    message: localizedCodeMessage(code, locale),
    message_key: localizedCodeKey(code),
  };
}

export function success(
  extra?: Record<string, unknown>,
  locale: Locale = "zh",
): ResponseBody {
  return {
    code: Code.OK,
    message: localizedCodeMessage(Code.OK, locale),
    message_key: localizedCodeKey(Code.OK),
    ...(extra ?? {}),
  };
}
