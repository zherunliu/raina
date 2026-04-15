import { randomUUID } from "crypto";
import type { ServerResponse } from "http";
import { getAiAgentManager } from "../ai/manager";
import type { ModelType } from "../ai/model";
import { Code } from "../code";
import { logger } from "../config";
import { getMessageBySessionId } from "../dao/message";
import {
  createSession,
  getSessionByUsername,
  softDeleteSession,
  updateSessionTitle,
} from "../dao/session";
import type { History } from "../model/message";
import type { SessionDto } from "../model/session";

async function ensureAgentHydrated(
  username: string,
  sessionId: string,
  modelType: ModelType,
  config: Record<string, unknown>,
) {
  const manager = getAiAgentManager();
  const agent = manager.getOrCreateAiAgent(
    username,
    sessionId,
    modelType,
    config,
  );
  if (agent.getMessages().length > 0) return agent;

  try {
    const msgs = await getMessageBySessionId(sessionId);
    for (const m of msgs) {
      agent.addMessage(m.content, m.username, m.is_user, false);
    }
  } catch (err: unknown) {
    logger.warn({ err, username, sessionId }, "Hydrate agent from DB failed");
  }
  return agent;
}

async function getSessionsByUsername(username: string): Promise<SessionDto[]> {
  const sessions = await getSessionByUsername(username);
  return sessions.map((s) => ({
    id: s.id,
    title: s.title || s.id,
  }));
}

async function renameSession(
  username: string,
  sessionId: string,
  title: string,
): Promise<Code> {
  try {
    const affected = await updateSessionTitle(username, sessionId, title);
    return affected > 0 ? Code.OK : Code.RecordNotFound;
  } catch (err: unknown) {
    logger.error({ err, username, sessionId }, "Rename session error");
    return Code.ServerError;
  }
}

async function deleteSession(
  username: string,
  sessionId: string,
): Promise<Code> {
  try {
    const affected = await softDeleteSession(username, sessionId);
    // Also drop in-memory agent to release memory.
    getAiAgentManager().removeAiAgent(username, sessionId);
    return affected > 0 ? Code.OK : Code.RecordNotFound;
  } catch (err: unknown) {
    logger.error({ err, username, sessionId }, "Delete session error");
    return Code.ServerError;
  }
}

async function createSessionAndSendMessage(
  username: string,
  userMessage: string,
  modelType: ModelType,
): Promise<[string, string, Code]> {
  const sessionId = randomUUID();
  try {
    await createSession({ id: sessionId, username, title: userMessage });
  } catch (err: unknown) {
    logger.error({ err }, "Create session error");
    return ["", "", Code.ServerError];
  }

  const manager = getAiAgentManager();
  const cfg = { username };

  try {
    const aiAgent = manager.getOrCreateAiAgent(
      username,
      sessionId,
      modelType,
      cfg,
    );
    const aiMessage = await aiAgent.response(username, userMessage);
    return [sessionId, aiMessage.content, Code.OK];
  } catch (err: unknown) {
    logger.error({ err }, "AI agent response error");
    return ["", "", Code.ModelError];
  }
}

async function createStreamSession(
  username: string,
  userMessage: string,
): Promise<[string, Code]> {
  const sessionId = randomUUID();
  try {
    await createSession({ id: sessionId, username, title: userMessage });
    return [sessionId, Code.OK];
  } catch (err: unknown) {
    logger.error({ err }, "Create session error");
    return ["", Code.ServerError];
  }
}

async function sendMessageStream2session(
  username: string,
  userMessage: string,
  modelType: ModelType,
  sessionId: string,
  res: ServerResponse,
): Promise<Code> {
  const cfg = { username };

  try {
    const aiAgent = await ensureAgentHydrated(
      username,
      sessionId,
      modelType,
      cfg,
    );
    const cb = (chunk: string) => {
      res.write(`data: ${chunk}\n\n`);
    };
    await aiAgent.responseStream(username, userMessage, cb);
    res.write("data: [DONE]\n\n");
    return Code.OK;
  } catch (err: unknown) {
    logger.error({ err }, "Stream message error");
    return Code.ModelError;
  }
}

async function sendMessage2session(
  username: string,
  userMessage: string,
  modelType: ModelType,
  sessionId: string,
): Promise<[string, Code]> {
  const cfg = { username };

  try {
    const aiAgent = await ensureAgentHydrated(
      username,
      sessionId,
      modelType,
      cfg,
    );
    const aiMessage = await aiAgent.response(username, userMessage);
    return [aiMessage.content, Code.OK];
  } catch (err: unknown) {
    logger.error({ err }, "AI agent response error");
    return ["", Code.ModelError];
  }
}

async function getChatHistoryList(
  username: string,
  sessionId: string,
): Promise<[History[], Code]> {
  try {
    const aiAgent = await ensureAgentHydrated(
      username,
      sessionId,
      "ollama" as ModelType,
      {
        username,
      },
    );
    const messages = aiAgent.getMessages();
    const historyList: History[] = messages.map((m) => ({
      is_user: m.is_user,
      content: m.content,
    }));
    return [historyList, Code.OK];
  } catch (err: unknown) {
    logger.error({ err }, "Get chat history error");
    return [[], Code.ServerError];
  }
}

const sessionService = {
  getSessionsByUsername,
  renameSession,
  deleteSession,
  createSessionAndSendMessage,
  createStreamSession,
  sendMessageStream2session,
  sendMessage2session,
  getChatHistoryList,
};

export default sessionService;
