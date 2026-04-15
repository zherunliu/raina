import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), ".env") });

type LogFn = (objOrMsg?: unknown, msg?: string) => void;

// Lightweight logger to keep migrated modules simple.
// Nest-side controllers/services can still use Nest Logger.
export const logger: Record<"info" | "warn" | "error" | "debug", LogFn> = {
  info: (objOrMsg?: unknown, msg?: string) => {
    if (msg) {
      console.log(msg, objOrMsg);
      return;
    }
    console.log(objOrMsg);
  },
  warn: (objOrMsg?: unknown, msg?: string) => {
    if (msg) {
      console.warn(msg, objOrMsg);
      return;
    }
    console.warn(objOrMsg);
  },
  error: (objOrMsg?: unknown, msg?: string) => {
    if (msg) {
      console.error(msg, objOrMsg);
      return;
    }
    console.error(objOrMsg);
  },
  debug: (objOrMsg?: unknown, msg?: string) => {
    if (process.env.DEBUG) {
      if (msg) {
        console.debug(msg, objOrMsg);
        return;
      }
      console.debug(objOrMsg);
    }
  },
};

export interface AppConfig {
  port: number;
  host: string;
  name: string;
}

export interface RedisConfig {
  enabled: boolean;
  port: number;
  db: number;
  host: string;
  password?: string;
}

export interface MysqlConfig {
  port: number;
  host: string;
  user: string;
  password?: string;
  db: string;
  charset: string;
}

export interface JwtConfig {
  expire_duration: number;
  issuer: string;
  subject: string;
  key: string;
}

export interface RagConfig {
  embedding_model: string;
  docs_dir: string;
  dimension: number;
}

export interface AiConfig {
  mode_name: string;
  base_url: string;
}

export interface Config {
  app: AppConfig;
  redis: RedisConfig;
  mysql: MysqlConfig;
  jwt: JwtConfig;
  rag: RagConfig;
  ai: AiConfig;
}

const config: Config = {
  app: {
    name: process.env.APP_NAME ?? "raina",
    host: process.env.APP_HOST ?? "0.0.0.0",
    // Nest uses PORT by convention; keep APP_PORT for parity with raina.
    port: Number.parseInt(
      process.env.PORT ?? process.env.APP_PORT ?? "3000",
      10,
    ),
  },
  redis: {
    enabled: process.env.REDIS_ENABLED === "true",
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number.parseInt(process.env.REDIS_PORT ?? "6379", 10),
    password: process.env.REDIS_PASSWORD ?? "",
    db: Number.parseInt(process.env.REDIS_DB ?? "0", 10),
  },
  mysql: {
    port: Number.parseInt(process.env.MYSQL_PORT ?? "3306", 10),
    host: process.env.MYSQL_HOST ?? "localhost",
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "pass",
    db: process.env.MYSQL_DB ?? "raina",
    charset: process.env.MYSQL_CHARSET ?? "utf8mb4",
  },
  jwt: {
    expire_duration: Number.parseInt(
      process.env.JWT_EXPIRE_DURATION ?? "8760",
      10,
    ),
    issuer: process.env.JWT_ISSUER ?? "raina",
    subject: process.env.JWT_SUBJECT ?? "raina",
    key: process.env.JWT_KEY ?? "raina",
  },
  rag: {
    embedding_model: process.env.RAG_EMBEDDING_MODEL ?? "nomic-embed-text",
    docs_dir: process.env.RAG_DOCS_DIR ?? "./docs",
    dimension: Number.parseInt(process.env.RAG_DIMENSION ?? "1024", 10),
  },
  ai: {
    mode_name: process.env.AI_MODE_NAME ?? process.env.OLLAMA_MODEL ?? "qwen3",
    base_url:
      process.env.AI_BASE_URL ??
      process.env.OLLAMA_BASE_URL ??
      "http://localhost:11434",
  },
};

export function getConfig(): Config {
  return config;
}
