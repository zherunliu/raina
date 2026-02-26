import { Injectable, Logger } from '@nestjs/common';
import { ChatService } from './chat/chat.service';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly systemPrompt = `You are a programming expert. Your name is Raina. You help users solve programming problems, with a focus on three areas:
- Planning programming learning paths
- Providing programming study advice
- Sharing high-frequency interview questions
Please solve users' programming problems using professional language.`;
  constructor(private readonly chatService: ChatService) {}
  async *chatStream(userMessage: string): AsyncGenerator<string> {
    const messages = [
      new SystemMessage(this.systemPrompt),
      new HumanMessage(userMessage),
    ];
    const streamingModel = this.chatService.getChatStreamModel();

    // Iterable readable stream (AI message chunk)
    const stream = await streamingModel.stream(messages);
    try {
      for await (const chunk of stream) {
        const content =
          typeof chunk.content === 'string'
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
      new SystemMessage(this.systemPrompt),
      new HumanMessage(userMessage),
    ];
    try {
      const response = await chatModel.invoke(messages);
      const content =
        typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);
      return content;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
