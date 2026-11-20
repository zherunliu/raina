import {
  createPool,
  createConnection,
  type Pool,
  type RowDataPacket,
  type ResultSetHeader,
  type PoolConnection,
} from "mysql2/promise";
import { config } from "./config";
const state = globalThis as typeof globalThis & { __rainaDatabase?: Pool };
export function db() {
  if (!state.__rainaDatabase) {
    const c = config();
    state.__rainaDatabase = createPool({
      host: c.MYSQL_HOST,
      port: c.MYSQL_PORT,
      user: c.MYSQL_USER,
      password: c.MYSQL_PASSWORD,
      database: c.MYSQL_DB,
      charset: "utf8mb4",
      connectionLimit: 10,
    });
  }
  return state.__rainaDatabase;
}
export async function query<T>(
  sql: string,
  values: (string | number | boolean | null | Date | Buffer)[] = [],
) {
  const [rows] = await db().query<RowDataPacket[]>(sql, values);
  return rows as T[];
}
export async function execute(
  sql: string,
  values: (string | number | boolean | null | Date | Buffer)[] = [],
) {
  const [result] = await db().execute<ResultSetHeader>(sql, values);
  return result;
}
export async function transaction<T>(
  callback: (connection: PoolConnection) => Promise<T>,
) {
  const connection = await db().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
export async function setupDatabase() {
  const c = config();
  const connection = await createConnection({
    host: c.MYSQL_HOST,
    port: c.MYSQL_PORT,
    user: c.MYSQL_USER,
    password: c.MYSQL_PASSWORD,
  });
  try {
    await connection.query(
      "CREATE DATABASE IF NOT EXISTS `" +
        c.MYSQL_DB +
        "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    );
  } finally {
    await connection.end();
  }
  await migrate();
}
export async function migrate() {
  await execute(`CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY, email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB`);
  await execute(`CREATE TABLE IF NOT EXISTS sessions (
    id CHAR(36) PRIMARY KEY, user_id CHAR(36) NOT NULL, title VARCHAR(128) NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, INDEX sessions_user_updated (user_id, updated_at)
  ) ENGINE=InnoDB`);
  await execute(`CREATE TABLE IF NOT EXISTS messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, session_id CHAR(36) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL, content MEDIUMTEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE, INDEX messages_session_id (session_id, id)
  ) ENGINE=InnoDB`);
}

export async function closeDatabase() {
  const pool = state.__rainaDatabase;
  state.__rainaDatabase = undefined;
  if (pool) await pool.end();
}
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}
export interface SessionRow {
  id: string;
  user_id: string;
  title: string;
}
export interface MessageRow {
  id: number;
  session_id: string;
  role: "user" | "assistant";
  content: string;
}
