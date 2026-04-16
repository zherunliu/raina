import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { ChatService } from "./chat/chat.service";

@Module({
  controllers: [AiController],
  providers: [AiService, ChatService],
})
export class AiModule {}
