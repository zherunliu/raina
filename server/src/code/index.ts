export enum Code {
  OK = 1000,
  ParamsInvalid = 2001,
  UserExist = 2002,
  UserNotExist = 2003,
  PasswordError = 2004,
  PasswordNotMatch = 2005,
  TokenInvalid = 2006,
  NotLogin = 2007,
  CaptchaInvalid = 2008,
  RecordNotFound = 2009,
  PasswordIllegal = 2010,
  Forbidden = 3001,
  ServerError = 4001,
  ModelNotFound = 5001,
  ModelNoPermission = 5002,
  ModelError = 5003,
}

export type Locale = "zh" | "en";

const phrasesByLocale: Record<Locale, Record<Code, string>> = {
  en: {
    [Code.OK]: "OK",
    [Code.ParamsInvalid]: "Params Invalid",
    [Code.UserExist]: "User Exist",
    [Code.UserNotExist]: "User Not Exist",
    [Code.PasswordError]: "Password Error",
    [Code.PasswordNotMatch]: "Password Not Match",
    [Code.TokenInvalid]: "Token Invalid",
    [Code.NotLogin]: "Not Login",
    [Code.CaptchaInvalid]: "Captcha Invalid",
    [Code.RecordNotFound]: "Record Not Found",
    [Code.PasswordIllegal]: "Password Illegal",
    [Code.Forbidden]: "Forbidden",
    [Code.ServerError]: "Server Error",
    [Code.ModelNotFound]: "Model Not Found",
    [Code.ModelNoPermission]: "Model No Permission",
    [Code.ModelError]: "Model service unavailable",
  },
  zh: {
    [Code.OK]: "成功",
    [Code.ParamsInvalid]: "参数错误",
    [Code.UserExist]: "用户已存在",
    [Code.UserNotExist]: "用户不存在",
    [Code.PasswordError]: "密码错误",
    [Code.PasswordNotMatch]: "两次密码不一致",
    [Code.TokenInvalid]: "登录态无效",
    [Code.NotLogin]: "未登录",
    [Code.CaptchaInvalid]: "验证码错误",
    [Code.RecordNotFound]: "记录不存在",
    [Code.PasswordIllegal]: "密码不合法",
    [Code.Forbidden]: "无权限",
    [Code.ServerError]: "服务端错误",
    [Code.ModelNotFound]: "模型不存在",
    [Code.ModelNoPermission]: "无模型权限",
    [Code.ModelError]: "模型服务不可用",
  },
};

const codeKeys: Record<Code, string> = {
  [Code.OK]: "code.OK",
  [Code.ParamsInvalid]: "code.ParamsInvalid",
  [Code.UserExist]: "code.UserExist",
  [Code.UserNotExist]: "code.UserNotExist",
  [Code.PasswordError]: "code.PasswordError",
  [Code.PasswordNotMatch]: "code.PasswordNotMatch",
  [Code.TokenInvalid]: "code.TokenInvalid",
  [Code.NotLogin]: "code.NotLogin",
  [Code.CaptchaInvalid]: "code.CaptchaInvalid",
  [Code.RecordNotFound]: "code.RecordNotFound",
  [Code.PasswordIllegal]: "code.PasswordIllegal",
  [Code.Forbidden]: "code.Forbidden",
  [Code.ServerError]: "code.ServerError",
  [Code.ModelNotFound]: "code.ModelNotFound",
  [Code.ModelNoPermission]: "code.ModelNoPermission",
  [Code.ModelError]: "code.ModelError",
};

export function codeMessage(code: Code, locale: Locale = "zh"): string {
  const table = phrasesByLocale[locale];
  return table[code];
}

export function codeMessageKey(code: Code): string {
  return codeKeys[code];
}
