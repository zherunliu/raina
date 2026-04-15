import { getAiAgentManager } from "../ai/manager";
import { ModelType } from "../ai/model";
import { logger } from "../config";
import { getAllMessages } from "../dao/message";

export async function loadDataFromDb(): Promise<void> {
  const manager = getAiAgentManager();
  try {
    const messages = await getAllMessages();
    for (const msg of messages) {
      try {
        const aiAgent = manager.getOrCreateAiAgent(
          msg.username,
          msg.session_id,
          ModelType.OLLAMA_MODEL,
          {},
        );
        // Rebuild in-memory history without re-persisting.
        aiAgent.addMessage(msg.content, msg.username, msg.is_user, false);
      } catch (err: unknown) {
        logger.error(
          { err, username: msg.username, sessionId: msg.session_id },
          "Create ai agent error",
        );
      }
    }
    logger.info("AI agent manager initialized");
  } catch (err: unknown) {
    logger.error({ err }, "Get all messages error");
  }
}
