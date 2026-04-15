import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
} from "@langchain/core/messages";
import type { Message } from "../model/message";

export function toAiMessages(messages: Message[]): BaseMessage[] {
  return messages.map((m) =>
    m.is_user ? new HumanMessage(m.content) : new AIMessage(m.content),
  );
}
