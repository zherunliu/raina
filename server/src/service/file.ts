import crc32 from "crc-32";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
} from "fs";
import { extname, join } from "path";
import { logger } from "../config";
import { validateFile } from "../utils/fs";

export function uploadFile4rag(
  username: string,
  file: { originalname: string; path: string },
): string {
  validateFile(file.originalname);

  const userDir = join("uploads", username);
  mkdirSync(userDir, { recursive: true });

  const extName = extname(file.originalname);
  const fileBuffer = readFileSync(file.path);
  const crc32Value = crc32.buf(fileBuffer) >>> 0;
  const filename = crc32Value.toString(16).padStart(8, "0");

  const dstPath = join(userDir, filename + extName);
  copyFileSync(file.path, dstPath);
  unlinkSync(file.path);
  logger.info(`File uploaded successfully: ${dstPath}`);
  return dstPath;
}

export function listUserFiles(username: string): string[] {
  const userDir = join("uploads", username);
  try {
    const files = readdirSync(userDir, { withFileTypes: true });
    return files
      .filter((f) => f.isFile())
      .map((f) => f.name)
      .filter((name) => name.endsWith(".md") || name.endsWith(".txt"));
  } catch {
    return [];
  }
}

export function deleteUserFile(username: string, filename: string): boolean {
  const userDir = join("uploads", username);
  // prevent path traversal by forcing basename-like input
  if (filename.includes("/") || filename.includes("\\")) {
    return false;
  }
  try {
    unlinkSync(join(userDir, filename));
    return true;
  } catch (err: unknown) {
    logger.warn({ err, username, filename }, "Delete user file error");
    return false;
  }
}
