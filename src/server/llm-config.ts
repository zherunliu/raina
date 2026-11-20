import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { parse } from "yaml";
import { z } from "zod";
export const EMBEDDING_MODEL = "qwen3.7-text-embedding-flash";
const providerSchema = z.object({
  name: z.string(),
  protocol: z.literal("openai-compat"),
  base_url: z.url(),
  api_key: z.string().min(1),
});
const chatSchema = providerSchema.extend({
  model: z.string().min(1),
  thinking: z
    .enum(["none", "minimal", "low", "medium", "high", "xhigh", "max"])
    .optional(),
  max_output_tokens: z.number().int().positive(),
  context_window: z.number().int().positive(),
});
export interface ModelConfig {
  chat: z.infer<typeof chatSchema>;
  embedding: z.infer<typeof providerSchema> & { model: string };
}
export function parseLlmConfig(source: string): ModelConfig {
  try {
    const root: unknown = parse(source);
    const doc = z.object({ providers: z.array(z.unknown()) }).parse(root);
    function find(name: string) {
      const matches = doc.providers.filter(
        (value) =>
          value &&
          typeof value === "object" &&
          "name" in value &&
          value.name === name,
      );
      if (matches.length !== 1) throw new Error("Missing or duplicate profile");
      return matches[0];
    }
    const chat = chatSchema.parse(find("ds-openai"));
    const embedding = {
      ...providerSchema.parse(find("ali-openai")),
      model: EMBEDDING_MODEL,
    };
    for (const provider of [chat, embedding]) {
      const url = new URL(provider.base_url);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        throw new Error("Invalid endpoint");
    }
    if (chat.max_output_tokens >= chat.context_window)
      throw new Error("Invalid token limits");
    return { chat, embedding };
  } catch {
    throw new Error(
      "Invalid Yukino model configuration; check ds-openai and ali-openai provider settings.",
    );
  }
}
let cached: { path: string; stamp: string; config: ModelConfig } | undefined;
export function llmConfig() {
  const configured = process.env.YUKINO_CONFIG_PATH || "~/.yukino/config.yaml";
  const path = resolve(configured.replace(/^~(?=\/|$)/, homedir()));
  try {
    const stat = statSync(path);
    const stamp = `${stat.mtimeMs}:${stat.size}`;
    if (cached?.path === path && cached.stamp === stamp) return cached.config;
    const config = parseLlmConfig(readFileSync(path, "utf-8"));
    cached = { path, stamp, config };
    return config;
  } catch {
    throw new Error(
      "Cannot load Yukino model configuration. Check YUKINO_CONFIG_PATH, ds-openai and ali-openai.",
    );
  }
}
