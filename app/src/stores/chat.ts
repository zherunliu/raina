import { defineStore } from "pinia";
import { ref } from "vue";
import type { ChatMessage, Conversation, DrawnCard } from "../types";
import { tGlobal } from "../i18n";
import { useQueryClient } from "@tanstack/vue-query";
import {
  createSessionAndSendMessageStream,
  deleteSessionApi,
  sendMessageStream2Session,
  type ModelType,
} from "../api";
import { queryKeys } from "../query-client";

type ConversationEx = Conversation & {
  serverSessionId: string | null;
};

export const useChatStore = defineStore("chat", () => {
  const queryClient = useQueryClient();
  const localConversations = ref<ConversationEx[]>([]);
  const currentConversationId = ref<string | null>(null);

  const localMessageCache = ref<Record<string, ChatMessage[]>>({});

  const isLoading = ref(false);
  const selectedModel = ref<ModelType>("ollama");
  const streamingEnabled = ref(true);

  function createConversation(title = tGlobal("sidebar.new_chat")): string {
    const id = `temp-${String(Date.now())}`;
    localConversations.value.unshift({
      id,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      serverSessionId: null,
    });
    currentConversationId.value = id;
    localMessageCache.value[id] = [];
    return id;
  }

  function getLocalMessages(sessionId: string) {
    if (!localMessageCache.value[sessionId]) {
      localMessageCache.value[sessionId] = [];
    }
    return localMessageCache.value[sessionId];
  }

  async function deleteConversation(
    id: string,
    serverSessionId?: string | null,
  ) {
    const index = localConversations.value.findIndex((c) => c.id === id);
    if (index > -1) {
      localConversations.value.splice(index, 1);
    }
    if (localMessageCache.value[id]) {
      delete localMessageCache.value[id];
    }
    if (serverSessionId && !serverSessionId.startsWith("temp-")) {
      const res = await deleteSessionApi(serverSessionId);
      if (res.code === 1000) {
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
      }
    }
    if (currentConversationId.value === id) {
      currentConversationId.value = null;
    }
  }

  function addMessage(
    sessionId: string,
    content: string,
    role: "user" | "assistant" | "system",
    cardInfo?: DrawnCard[],
  ) {
    const messages = getLocalMessages(sessionId);
    const message: ChatMessage = {
      id: `${String(Date.now())}-${Math.random().toString(36).slice(2)}`,
      role,
      content,
      timestamp: Date.now(),
      cardInfo,
    };
    messages.push(message);

    const conv = localConversations.value.find((c) => c.id === sessionId);
    if (
      conv &&
      role === "user" &&
      messages.filter((m) => m.role === "user").length === 1
    ) {
      conv.title = content.slice(0, 20) + (content.length > 20 ? "..." : "");
    }

    return message;
  }

  function updateLastAssistantMessage(sessionId: string, content: string) {
    const messages = getLocalMessages(sessionId);
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg?.role === "assistant") {
        msg.content = content;
        break;
      }
    }
  }

  async function sendMessage(
    sessionId: string,
    displayContent: string,
    sendContent: string,
    cardInfo?: DrawnCard[],
  ) {
    if (!sessionId || isLoading.value) return;

    addMessage(sessionId, displayContent, "user", cardInfo);
    isLoading.value = true;
    addMessage(sessionId, "", "assistant");

    try {
      const convConfig = localConversations.value.find(
        (c) => c.id === sessionId,
      );
      const serverSessionId =
        convConfig?.serverSessionId ||
        (sessionId.startsWith("temp-") ? null : sessionId);

      if (!serverSessionId) {
        const streamIt = createSessionAndSendMessageStream(
          sendContent,
          selectedModel.value,
        );
        for await (const ev of streamIt) {
          if (ev.kind === "session") {
            const sid = ev.session_id;
            if (convConfig) {
              convConfig.serverSessionId = sid;
              convConfig.id = sid;
            }
            const existingMessages = localMessageCache.value[sessionId];
            if (existingMessages) {
              localMessageCache.value[sid] = existingMessages;
              delete localMessageCache.value[sessionId];
            }
            if (currentConversationId.value === sessionId) {
              currentConversationId.value = sid;
            }
            sessionId = sid;
            queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
          } else if (ev.kind === "chunk") {
            updateLastAssistantMessage(sessionId, ev.content);
          }
        }
      } else {
        const streamIt = sendMessageStream2Session(
          serverSessionId,
          sendContent,
          selectedModel.value,
        );
        for await (const ev of streamIt) {
          if (ev.kind === "chunk") {
            updateLastAssistantMessage(sessionId, ev.content);
          }
        }
      }
    } catch (err) {
      updateLastAssistantMessage(sessionId, tGlobal("chat.error_try_later"));
      throw err;
    } finally {
      isLoading.value = false;
      queryClient.invalidateQueries({ queryKey: queryKeys.history(sessionId) });
    }
  }

  return {
    localConversations,
    currentConversationId,
    isLoading,
    selectedModel,
    streamingEnabled,
    localMessageCache,
    createConversation,
    getLocalMessages,
    deleteConversation,
    sendMessage,
  };
});
