import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ConfigService } from "@nestjs/config";
import { ChatOllama } from "@langchain/ollama";

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);
  private chatModel: BaseChatModel;
  private chatStreamModel: BaseChatModel;
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const baseUrl = this.configService.get<string>(
      "OLLAMA_BASE_URL",
      "http://localhost:11434",
    );
    const modelName = this.configService.get<string>(
      "OLLAMA_MODEL",
      "glm-5:cloud",
    );
    this.chatModel = new ChatOllama({
      baseUrl: baseUrl,
      model: modelName,
    });
    this.chatStreamModel = new ChatOllama({
      baseUrl: baseUrl,
      model: modelName,
      streaming: true,
    });
    this.logger.log(`Ollama model initialized: ${modelName} at ${baseUrl}`);
  }

  getChatModel() {
    return this.chatModel;
  }

  getChatStreamModel() {
    return this.chatStreamModel;
  }
}
