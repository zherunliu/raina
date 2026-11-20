import { resolve } from "node:path";
import { z } from "zod";
const envSchema = z.object({
  MYSQL_HOST: z.string().default("127.0.0.1"),
  MYSQL_PORT: z.coerce.number().int().positive().default(3306),
  MYSQL_USER: z.string().default("root"),
  MYSQL_PASSWORD: z.string().default("pass"),
  MYSQL_DB: z
    .string()
    .regex(/^[a-zA-Z0-9_]+$/)
    .default("raina"),
  REDIS_ENABLED: z.enum(["true", "false"]).default("true"),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  JWT_KEY: z.string().min(32),
  JWT_EXPIRE_HOURS: z.coerce.number().positive().default(168),
  DATA_DIR: z.string().default("./data"),
});
export function config() {
  const env = envSchema.parse(process.env);
  return { ...env, DATA_DIR: resolve(env.DATA_DIR) };
}
