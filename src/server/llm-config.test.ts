import { describe, expect, it } from "vitest";
import { EMBEDDING_MODEL, parseLlmConfig } from "./llm-config";
const profiles = () => ({
  providers: [
    {
      name: "ds-openai",
      protocol: "openai-compat",
      base_url: "https://chat.example/v1",
      api_key: "private-chat-key",
      model: "deepseek-flash",
      thinking: "high",
      max_output_tokens: 128000,
      context_window: 1000000,
    },
    {
      name: "ali-openai",
      protocol: "openai-compat",
      base_url: "https://embed.example/v1",
      api_key: "private-embedding-key",
      model: "chat-model-that-must-not-be-used-for-embeddings",
    },
  ],
});
describe("Yukino model configuration", () => {
  it("selects ds-openai for chat and overrides only ali-openai's embedding model", () => {
    const config = parseLlmConfig(JSON.stringify(profiles()));
    expect(config.chat.model).toBe("deepseek-flash");
    expect(config.chat.thinking).toBe("high");
    expect(config.chat.max_output_tokens).toBe(128000);
    expect(config.embedding.model).toBe(EMBEDDING_MODEL);
    expect(config.embedding.base_url).toBe("https://embed.example/v1");
    expect(config.embedding.api_key).toBe("private-embedding-key");
  });
  it("parses YAML and rejects missing or duplicate providers", () => {
    const source = profiles();
    expect(() =>
      parseLlmConfig(
        JSON.stringify({ providers: source.providers.slice(0, 1) }),
      ),
    ).toThrow("Invalid Yukino");
    source.providers.push(source.providers[0]);
    expect(() => parseLlmConfig(JSON.stringify(source))).toThrow(
      "Invalid Yukino",
    );
  });
  it("rejects malformed or non-HTTP configuration without leaking credentials", () => {
    const source = profiles();
    source.providers[0].base_url = "file:///tmp/private-chat-key";
    try {
      parseLlmConfig(JSON.stringify(source));
      throw new Error("Expected rejection");
    } catch (error) {
      expect((error as Error).message).toContain("Invalid Yukino");
      expect((error as Error).message).not.toContain("private-chat-key");
    }
    expect(() => parseLlmConfig("providers: [")).toThrow("Invalid Yukino");
  });
});
