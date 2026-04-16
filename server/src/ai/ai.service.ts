import { Injectable, Logger } from "@nestjs/common";
import { ChatService } from "./chat/chat.service";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { Locale } from "../code";

const CHAT_PROMPTS: Record<Locale, string> = {
  zh: "你叫 Raina。你是一位具备心理学背景的塔罗咨询师。核心规则：1）如果没有抽到牌，就像普通聊天一样自然回应。2）如果有牌，请把牌义作为心理隐喻，引导用户自我觉察与反思，避免做绝对化预测。3）如果问题不适合塔罗，请温和地引导用户换一种问法。禁止使用 emoji。",
  en: "Your name is Raina. You are a tarot reader with a psychology background. Core rules: 1) If there are no cards, chat normally. 2) If there are cards, use the meanings as psychological metaphors and help the user reflect, avoid absolute predictions. 3) If the question is not suitable for tarot, gently guide the user to rephrase. No emoji.",
};

const DAILY_PROMPTS: Record<Locale, string> = {
  zh: "你叫 Raina。你是一位具备心理学背景的塔罗咨询师。请基于抽到的牌生成一段简洁的今日运势。不要使用 markdown，不要使用 emoji。",
  en: "Your name is Raina. You are a tarot reader with a psychology background. Based on the card(s), generate a concise daily fortune. No markdown, no emoji.",
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private systemPromptChat(locale: Locale = "zh"): string {
    return CHAT_PROMPTS[locale];
  }

  private systemPromptDaily(locale: Locale = "zh"): string {
    return DAILY_PROMPTS[locale];
  }

  constructor(private readonly chatService: ChatService) {}
  async *chatStream(
    userMessage: string,
    locale: Locale = "zh",
  ): AsyncGenerator<string> {
    const messages = [
      new SystemMessage(this.systemPromptChat(locale)),
      new HumanMessage(userMessage),
    ];
    const streamingModel = this.chatService.getChatStreamModel();

    // Iterable readable stream (AI message chunk)
    const stream = await streamingModel.stream(messages);
    try {
      for await (const chunk of stream) {
        const content =
          typeof chunk.content === "string"
            ? chunk.content
            : JSON.stringify(chunk.content);
        if (content) {
          yield content;
        }
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
    this.logger.log(`chatStream completed!`);
  }

  async chat(userMessage: string, locale: Locale = "zh"): Promise<string> {
    const chatModel = this.chatService.getChatModel();
    const messages = [
      new SystemMessage(this.systemPromptDaily(locale)),
      new HumanMessage(userMessage),
    ];
    try {
      const response = await chatModel.invoke(messages);
      const content =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
      return content;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
