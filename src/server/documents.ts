import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { config } from "./config";
import { AppError, Code } from "./errors";
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
const validName = /^[a-f0-9]{64}\.(md|txt)$/;
export function userDirectory(userId: string) {
  if (!/^[a-f0-9-]{36}$/.test(userId)) throw new AppError(Code.ParamsInvalid);
  return join(config().DATA_DIR, "uploads", userId);
}
export async function listDocuments(userId: string) {
  try {
    return (await readdir(userDirectory(userId), { withFileTypes: true }))
      .filter((file) => file.isFile() && validName.test(file.name))
      .map((file) => file.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
export async function saveDocument(userId: string, file: File) {
  const ext = extname(file.name).toLowerCase();
  if (
    ![".md", ".txt"].includes(ext) ||
    !file.size ||
    file.size > MAX_FILE_BYTES
  )
    throw new AppError(Code.ParamsInvalid, 400);
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new AppError(Code.ParamsInvalid);
  }
  const filename = createHash("sha256").update(bytes).digest("hex") + ext;
  const files = await listDocuments(userId);
  if (files.length >= 100 && !files.includes(filename))
    throw new AppError(Code.ParamsInvalid, 413);
  await mkdir(userDirectory(userId), { recursive: true });
  const path = join(userDirectory(userId), filename);
  // Rename atomically so retrieval never observes a partial upload.
  const temp = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temp, bytes);
    const { rename } = await import("node:fs/promises");
    await rename(temp, path);
  } finally {
    await unlink(temp).catch(() => {});
  }
  return filename;
}
export async function deleteDocument(userId: string, filename: string) {
  if (!validName.test(filename)) throw new AppError(Code.ParamsInvalid);
  try {
    await unlink(join(userDirectory(userId), filename));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new AppError(Code.RecordNotFound, 404);
    throw error;
  }
}
export async function documentChunks(userId: string) {
  const result: string[] = [];
  let size = 0;
  for (const filename of await listDocuments(userId)) {
    const text = await readFile(join(userDirectory(userId), filename), "utf-8");
    size += Buffer.byteLength(text);
    if (size > 16 * 1024 * 1024) throw new AppError(Code.ParamsInvalid, 413);
    for (let start = 0; start < text.length; start += 800) {
      result.push(text.slice(start, start + 1000));
      if (result.length > 2048) throw new AppError(Code.ParamsInvalid, 413);
    }
  }
  return result;
}
