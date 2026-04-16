import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request, Response } from "express";
import { Code } from "../code";
import { codeOf } from "../controller/response";
import { detectLocale } from "../i18n";
import { parseToken } from "../utils/jwt";
import { getUserByUsername } from "../dao/user";
import { UserVo } from "../model/user";

function getTokenFromQuery(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }
  return "";
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<
      Request & {
        user?: Partial<UserVo>;
      }
    >();
    const res = http.getResponse<Response>();

    let token = "";
    const authHeader = req.header("Authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length);
    } else {
      // req.query: Record<string, unknown>
      token = getTokenFromQuery(req.query.token);
    }

    if (!token) {
      res.status(401).json(codeOf(Code.TokenInvalid, detectLocale(req)));
      return false;
    }

    const [username, ok] = parseToken(token);
    if (!ok) {
      res.status(401).json(codeOf(Code.TokenInvalid, detectLocale(req)));
      return false;
    }

    const userInDb = await getUserByUsername(username);
    if (!userInDb) {
      res.status(401).json(codeOf(Code.TokenInvalid, detectLocale(req)));
      return false;
    }

    req.user = { ...userInDb };
    return true;
  }
}
