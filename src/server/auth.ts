import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
import {
  getCookie,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server";
import { config } from "./config";
import { query, execute, type UserRow } from "./db";
import { AppError, Code } from "./errors";
const derive = promisify(scrypt);
const COOKIE = "raina_session";
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await derive(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${hash.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [format, salt, hash] = stored.split(":");
  if (format !== "scrypt" || !salt || !/^[a-f0-9]{128}$/.test(hash || ""))
    return false;
  const derived = (await derive(password, salt, 64)) as Buffer;
  return timingSafeEqual(derived, Buffer.from(hash, "hex"));
}
export async function register(email: string, password: string) {
  const user = {
    id: randomUUID(),
    email: email.toLowerCase(),
    password_hash: await hashPassword(password),
  };
  try {
    await execute(
      "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
      [user.id, user.email, user.password_hash],
    );
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY")
      throw new AppError(Code.UserExist, 409);
    throw error;
  }
  return user;
}
export async function login(email: string, password: string) {
  const user = (
    await query<UserRow>("SELECT * FROM users WHERE email = ?", [
      email.toLowerCase(),
    ])
  )[0];
  if (!user || !(await verifyPassword(password, user.password_hash)))
    throw new AppError(Code.PasswordError, 401);
  return user;
}
export function setSession(user: UserRow, request: Request) {
  const c = config();
  const maxAge = Math.floor(c.JWT_EXPIRE_HOURS * 3600);
  const token = jwt.sign({}, c.JWT_KEY, {
    algorithm: "HS256",
    subject: user.id,
    issuer: "raina",
    audience: "raina",
    expiresIn: maxAge,
  });
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
    path: "/",
    maxAge,
  });
}
export function clearSession() {
  deleteCookie(COOKIE, { path: "/" });
}
export async function currentUser() {
  const token = getCookie(COOKIE);
  if (!token) return null;
  let id: string;
  try {
    const payload = jwt.verify(token, config().JWT_KEY, {
      algorithms: ["HS256"],
      issuer: "raina",
      audience: "raina",
    });
    if (typeof payload === "string" || typeof payload.sub !== "string")
      return null;
    id = payload.sub;
  } catch {
    return null;
  }
  return (
    (await query<UserRow>("SELECT * FROM users WHERE id = ?", [id]))[0] || null
  );
}
