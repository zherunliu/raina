import OpenAI from "openai";
import { llmConfig } from "./llm-config";
import { AppError, Code } from "./errors";
export interface ModelMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
export async function* generate(
  messages: ModelMessage[],
  streaming: boolean,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const profile = llmConfig().chat;
  const client = new OpenAI({
    apiKey: profile.api_key,
    baseURL: profile.base_url,
    maxRetries: 0,
    timeout: 120_000,
  });
  const params = {
    model: profile.model,
    messages,
    max_tokens: profile.max_output_tokens,
    reasoning_effort:
      profile.thinking === "none" ? undefined : profile.thinking,
    // ds-openai uses the OpenAI protocol with DeepSeek's explicit thinking toggle.
    thinking: { type: profile.thinking === "none" ? "disabled" : "enabled" },
  };
  try {
    signal.throwIfAborted();
    if (!streaming) {
      const result = await client.chat.completions.create(
        { ...params, stream: false },
        { signal },
      );
      const choice = result.choices[0];
      if (choice?.finish_reason !== "stop" || !choice.message.content)
        throw new AppError(Code.ModelError, 502);
      yield choice.message.content;
      return;
    }
    const stream = await client.chat.completions.create(
      { ...params, stream: true },
      { signal },
    );
    let completed = false;
    let hasContent = false;
    try {
      for await (const chunk of stream) {
        signal.throwIfAborted();
        const choice = chunk.choices.find((value) => value.index === 0);
        if (!choice) continue;
        if (choice.delta.content) {
          hasContent = true;
          yield choice.delta.content;
        }
        if (choice.finish_reason !== null) {
          if (choice.finish_reason !== "stop")
            throw new AppError(Code.ModelError, 502);
          completed = true;
        }
      }
      if (!completed || !hasContent) throw new AppError(Code.ModelError, 502);
    } finally {
      stream.controller.abort();
    }
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof AppError) throw error;
    // Upstream errors can include request bodies or credentials; expose only the business error.
    throw new AppError(Code.ModelError, 502);
  }
}

export async function embed(
  input: string[],
  signal: AbortSignal,
): Promise<number[][]> {
  const profile = llmConfig().embedding;
  const client = new OpenAI({
    apiKey: profile.api_key,
    baseURL: profile.base_url,
    maxRetries: 0,
    timeout: 120_000,
  });
  try {
    signal.throwIfAborted();
    const response = await client.embeddings.create(
      { model: profile.model, input, encoding_format: "float" },
      { signal },
    );
    const data = [...response.data].sort((a, b) => a.index - b.index);
    if (
      data.length !== input.length ||
      data.some(
        (item, i) =>
          item.index !== i ||
          !Array.isArray(item.embedding) ||
          !item.embedding.length ||
          item.embedding.some((value) => !Number.isFinite(value)),
      )
    )
      throw new AppError(Code.ModelError, 502);
    const dimensions = data[0]?.embedding.length;
    if (
      !dimensions ||
      data.some((item) => item.embedding.length !== dimensions)
    )
      throw new AppError(Code.ModelError, 502);
    return data.map((item) => item.embedding);
  } catch (error) {
    signal.throwIfAborted();
    if (error instanceof AppError) throw error;
    throw new AppError(Code.ModelError, 502);
  }
}
