import { Injectable, Logger } from "@nestjs/common";
import { ChatService } from "./chat/chat.service";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private systemPromptChat(): string {
    return "Your name is Raina. You are a tarot reader with a psychology background. Core rules: 1) If there are no cards, chat normally. 2) If there are cards, use the meanings as psychological metaphors and help the user reflect, avoid absolute predictions. 3) If the question is not suitable for tarot, gently guide the user to rephrase. No emoji.";
  }

  private systemPromptDaily(): string {
    return "Your name is Raina. You are a tarot reader with a psychology background. Based on the card(s), generate a concise daily fortune. No markdown, no emoji.";
  }

  constructor(private readonly chatService: ChatService) {}
  async *chatStream(userMessage: string): AsyncGenerator<string> {
    const messages = [
      new SystemMessage(this.systemPromptChat()),
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

  async chat(userMessage: string): Promise<string> {
    const chatModel = this.chatService.getChatModel();
    const messages = [
      new SystemMessage(this.systemPromptDaily()),
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
