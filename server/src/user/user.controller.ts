import { Body, Controller, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { z } from "zod";
import { Code } from "../code";
import { detectLocale } from "../i18n";
import userService from "../service/user";
import { codeOf, success, type ResponseBody } from "../controller/response";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

@Controller("user")
export class UserController {
  @Post("login")
  async login(
    @Req() req: Request,
    @Body() body: unknown,
  ): Promise<ResponseBody> {
    const locale = detectLocale(req);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return codeOf(Code.ParamsInvalid, locale);
    }
    const { username, password } = parsed.data;
    const [token, code] = await userService.login(username, password);
    if (code !== Code.OK) {
      return codeOf(code, locale);
    }
    return success({ token }, locale);
  }

  @Post("register")
  async register(
    @Req() req: Request,
    @Body() body: unknown,
  ): Promise<ResponseBody> {
    const locale = detectLocale(req);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return codeOf(Code.ParamsInvalid, locale);
    }
    const { email, password } = parsed.data;
    const [token, username, code] = await userService.register(email, password);
    if (code !== Code.OK) {
      return codeOf(code, locale);
    }
    return success({ token, username }, locale);
  }
}
