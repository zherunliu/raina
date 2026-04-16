import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { z } from "zod";

import { AuthGuard } from "../auth/auth.guard";
import { Code } from "../code";
import { codeOf, success, type ResponseBody } from "../controller/response";
import { detectLocale } from "../i18n";
import sessionService from "../service/session";
import { ModelType } from "./model";
import { AiService } from "./ai.service";

const questionModelSchema = z.object({
  question: z.string().min(1),
  model_type: z.enum([ModelType.OLLAMA_MODEL, ModelType.OLLAMA_RAG_MODEL]),
});

const questionModelSessionSchema = questionModelSchema.extend({
  session_id: z.string().min(1),
});

const sessionIdSchema = z.object({
  session_id: z.string().min(1),
});

const renameSessionSchema = z.object({
  session_id: z.string().min(1),
  title: z.string().min(1).max(128),
});

@Controller("ai")
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("tarot/daily")
  async tarotDaily(
    @Req() req: Request,
    @Body() body: unknown,
  ): Promise<ResponseBody> {
    const locale = detectLocale(req);
    const parsed = z.object({ message: z.string().min(1) }).safeParse(body);
    if (!parsed.success) {
      return codeOf(Code.ParamsInvalid, locale);
    }

    try {
      const content = await this.aiService.chat(parsed.data.message, locale);
      return success({ answer: content }, locale);
    } catch {
      return codeOf(Code.ModelError, locale);
    }
  }

  @Get("chat/get-user-sessions-by-username")
  async getUserSessionsByUsername(@Req() req: Request): Promise<ResponseBody> {
    const locale = detectLocale(req);
    const username = (req as Request & { user: { username: string } }).user
      .username;
    const sessions = await sessionService.getSessionsByUsername(username);
    return success({ sessions }, locale);
  }

  @Post("chat/rename-session")
  async renameSession(
    @Req() req: Request,
    @Body() body: unknown,
  ): Promise<ResponseBody> {
    const locale = detectLocale(req);
    const username = (req as Request & { user: { username: string } }).user
      .username;
    const parsed = renameSessionSchema.safeParse(body);
    if (!parsed.success) {
      return codeOf(Code.ParamsInvalid, locale);
    }
    const code = await sessionService.renameSession(
      username,
      parsed.data.session_id,
      parsed.data.title,
    );
    return code === Code.OK ? success(undefined, locale) : codeOf(code, locale);
  }

  @Post("chat/delete-session")
  async deleteSession(
    @Req() req: Request,
    @Body() body: unknown,
  ): Promise<ResponseBody> {
    const locale = detectLocale(req);
    const username = (req as Request & { user: { username: string } }).user
      .username;
    const parsed = sessionIdSchema.safeParse(body);
    if (!parsed.success) {
      return codeOf(Code.ParamsInvalid, locale);
    }
    const code = await sessionService.deleteSession(
      username,
      parsed.data.session_id,
    );
    return code === Code.OK ? success(undefined, locale) : codeOf(code, locale);
  }

  @Post("chat/create-session-and-send-message")
  async createSessionAndSendMessage(
    @Req() req: Request,
    @Body() body: unknown,
  ): Promise<ResponseBody> {
    const locale = detectLocale(req);
    const username = (req as Request & { user: { username: string } }).user
      .username;
    const parsed = questionModelSchema.safeParse(body);
    if (!parsed.success) {
      return codeOf(Code.ParamsInvalid, locale);
    }
    const { question, model_type } = parsed.data;

    const [sessionId, aiMessage, code] =
      await sessionService.createSessionAndSendMessage(
        username,
        question,
        model_type,
      );
    if (code !== Code.OK) {
      return codeOf(code, locale);
    }

    return success({ session_id: sessionId, answer: aiMessage }, locale);
  }

  @Post("chat/send-message-2-session")
  async sendMessage2session(
    @Req() req: Request,
    @Body() body: unknown,
  ): Promise<ResponseBody> {
    const locale = detectLocale(req);
    const username = (req as Request & { user: { username: string } }).user
      .username;
    const parsed = questionModelSessionSchema.safeParse(body);
    if (!parsed.success) {
      return codeOf(Code.ParamsInvalid, locale);
    }
    const { question, model_type, session_id } = parsed.data;

    const [aiMessage, code] = await sessionService.sendMessage2session(
      username,
      question,
      model_type,
      session_id,
    );
    if (code !== Code.OK) {
      return codeOf(code, locale);
    }

    return success({ answer: aiMessage }, locale);
  }

  @Post("chat/get-chat-history-list")
  async getChatHistoryList(
    @Req() req: Request,
    @Body() body: unknown,
  ): Promise<ResponseBody> {
    const locale = detectLocale(req);
    const username = (req as Request & { user: { username: string } }).user
      .username;
    const parsed = sessionIdSchema.safeParse(body);
    if (!parsed.success) {
      return codeOf(Code.ParamsInvalid, locale);
    }
    const { session_id } = parsed.data;

    const [historyList, code] = await sessionService.getChatHistoryList(
      username,
      session_id,
    );
    if (code !== Code.OK) {
      return codeOf(code, locale);
    }

    return success({ history: historyList }, locale);
  }

  @Post("chat/send-message-stream-2-session")
  async sendMessageStream2session(
    @Req() req: Request,
    @Body() body: unknown,
    @Res() res: Response,
  ): Promise<void> {
    const locale = detectLocale(req);
    const username = (req as Request & { user: { username: string } }).user
      .username;
    const parsed = questionModelSessionSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json(codeOf(Code.ParamsInvalid, locale));
      return;
    }
    const { question, model_type, session_id } = parsed.data;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    const code = await sessionService.sendMessageStream2session(
      username,
      question,
      model_type,
      session_id,
      res,
    );
    if (code !== Code.OK) {
      res.write(
        `event: error\ndata: ${JSON.stringify(codeOf(code, locale))}\n\n`,
      );
    }
    res.end();
  }

  @Post("chat/create-session-and-send-message-stream")
  async createStreamSessionAndSendMessageStream(
    @Req() req: Request,
    @Body() body: unknown,
    @Res() res: Response,
  ): Promise<void> {
    const locale = detectLocale(req);
    const username = (req as Request & { user: { username: string } }).user
      .username;
    const parsed = questionModelSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json(codeOf(Code.ParamsInvalid, locale));
      return;
    }
    const { question, model_type } = parsed.data;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    const [sessionId, sessionCode] = await sessionService.createStreamSession(
      username,
      question,
    );
    if (sessionCode !== Code.OK) {
      res.write(
        `event: error\ndata: ${JSON.stringify(codeOf(sessionCode, locale))}\n\n`,
      );
      res.end();
      return;
    }

    res.write(`data: ${JSON.stringify({ session_id: sessionId })}\n\n`);

    const code = await sessionService.sendMessageStream2session(
      username,
      question,
      model_type,
      sessionId,
      res,
    );
    if (code !== Code.OK) {
      res.write(
        `event: error\ndata: ${JSON.stringify(codeOf(code, locale))}\n\n`,
      );
    }
    res.end();
  }
}
