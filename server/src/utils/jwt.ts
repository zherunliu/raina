import jwt, { type JwtPayload } from "jsonwebtoken";
import { getConfig, logger } from "../config";

interface Claims {
  id: number;
  username: string;
}

export function jwtToken(id: number, username: string): string {
  const cfg = getConfig().jwt;
  const payload: Claims = { id, username };
  return jwt.sign(payload, cfg.key, {
    expiresIn: cfg.expire_duration * 60 * 60,
    issuer: cfg.issuer,
    subject: cfg.subject,
  });
}

function isTokenPayload(
  value: string | JwtPayload,
): value is JwtPayload & { username: string } {
  return typeof value !== "string" && typeof value.username === "string";
}

export function parseToken(token: string): [string, boolean] {
  try {
    const cfg = getConfig().jwt;
    const decoded = jwt.verify(token, cfg.key);
    if (!isTokenPayload(decoded)) {
      return ["", false];
    }
    return [decoded.username, true];
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.warn(
        { name: err.name, message: err.message },
        "Parse token failed",
      );
      return ["", false];
    }
    logger.warn({ err }, "Parse token failed");
    return ["", false];
  }
}
