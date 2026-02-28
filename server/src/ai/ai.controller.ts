import {
  Controller,
  Post,
  HttpStatus,
  Logger,
  Body,
  Res,
} from '@nestjs/common';
import { type Response } from 'express';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body('message') message: string, @Res() res: Response) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(HttpStatus.OK);

    try {
      const stream = this.aiService.chatStream(message);
      for await (const chunk of stream) {
        res.write(`data: ${chunk}\n\n`);
      }
      res.end();
    } catch (err) {
      this.logger.error('Chat stream error:', err);
      res.write('Chat stream error');
      res.end();
    }
  }

  @Post('chat/sync')
  async chatSync(@Body('message') message: string): Promise<string> {
    return this.aiService.chat(message);
  }
}
