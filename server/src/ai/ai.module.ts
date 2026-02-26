import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ChatService } from './chat/chat.service';

@Module({
  controllers: [AiController],
  providers: [AiService, ChatService],
})
export class AiModule {}
