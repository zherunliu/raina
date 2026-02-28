import { Injectable, Logger } from '@nestjs/common';
import { ChatService } from './chat/chat.service';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly systemPromptChat = `你叫 Raina，你是一位结合心理学的塔罗解读师。核心规则：1. 无牌时正常交流；2. 有牌时，将牌义作为心理投射的隐喻，结合用户现状进行疏导，拒绝绝对化预言；3. 如果用户的问题不是一个好的塔罗问题，温和引导用户重新提问。`;
  private readonly systemPromptDaily = `你叫 Raina，你是一位结合心理学的塔罗解读师，请根据牌面直接生成简短的今日运势。（不需要任何格式和emoji）`;
  constructor(private readonly chatService: ChatService) {}
  async *chatStream(userMessage: string): AsyncGenerator<string> {
    const messages = [
      new SystemMessage(this.systemPromptChat),
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
      new SystemMessage(this.systemPromptDaily),
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
