import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { ChatMessage, Conversation, DrawnCard } from "../types";
import { tGlobal } from "../i18n";
import {
  createSessionAndSendMessageStream,
  deleteSessionApi,
  getChatHistoryApi,
  getSessionsApi,
  sendMessageStream2Session,
  type ModelType,
} from "../api";

type ConversationEx = Conversation & {
  serverSessionId: string | null;
};

export const useChatStore = defineStore("chat", () => {
  const conversations = ref<ConversationEx[]>([]);
  const currentConversationId = ref<string | null>(null);
  const isLoading = ref(false);
  const selectedModel = ref<ModelType>("ollama");
  const streamingEnabled = ref(true);
  const initialized = ref(false);

  const currentConversation = computed(() =>
    conversations.value.find((c) => c.id === currentConversationId.value),
  );

  const currentMessages = computed(
    () => currentConversation.value?.messages ?? [],
  );

  async function ensureInitialized() {
    if (initialized.value) return;
    await refreshSessions();
    initialized.value = true;
  }

  async function refreshSessions() {
    const res = await getSessionsApi();
    if (res.code !== 1000) {
      // If token is invalid, router guard will force login on next nav.
      conversations.value = [];
      currentConversationId.value = null;
      return;
    }
    const list = (res.sessions ?? []).map((s) => ({
      id: s.id,
      title: s.title || s.id,
      messages: [] as ChatMessage[],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      serverSessionId: s.id,
    }));
    conversations.value = list;
    const stillExists = currentConversationId.value
      ? conversations.value.some((c) => c.id === currentConversationId.value)
      : false;
    if (!currentConversationId.value || !stillExists) {
      if (conversations.value.length > 0) {
        currentConversationId.value = conversations.value[0]?.id ?? null;
      } else {
        createConversation();
      }
    }
  }

  function createConversation(title = tGlobal("sidebar.new_chat")): string {
    const id = `temp-${String(Date.now())}`;
    const conversation: ConversationEx = {
      id,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      serverSessionId: null,
    };
    conversations.value.unshift(conversation);
    currentConversationId.value = id;
    return id;
  }

  async function deleteConversation(id: string) {
    const index = conversations.value.findIndex((c) => c.id === id);
    if (index > -1) {
      const conv = conversations.value[index]!;
      if (conv.serverSessionId) {
        const res = await deleteSessionApi(conv.serverSessionId);
        if (res.code !== 1000) {
          return;
        }
      }
      conversations.value.splice(index, 1);
      if (currentConversationId.value === id) {
        currentConversationId.value = conversations.value[0]?.id ?? null;
      }
    }
  }

  async function setCurrentConversation(id: string) {
    currentConversationId.value = id;
    const conv = conversations.value.find((c) => c.id === id);
    if (!conv) return;
    if (conv.serverSessionId && conv.messages.length === 0) {
      const res = await getChatHistoryApi(conv.serverSessionId);
      if (res.code === 1000 && Array.isArray(res.history)) {
        conv.messages = res.history.map((h) => ({
          id: `${String(Date.now())}-${Math.random().toString(36).slice(2)}`,
          role: h.is_user ? "user" : "assistant",
          content: h.content,
          timestamp: Date.now(),
        }));
      }
    }
  }

  function addMessage(
    content: string,
    role: "user" | "assistant" | "system",
    cardInfo?: DrawnCard[],
  ) {
    if (!currentConversation.value) {
      createConversation();
    }
    const conv = currentConversation.value!;
    const message: ChatMessage = {
      id: `${String(Date.now())}-${Math.random().toString(36).slice(2)}`,
      role,
      content,
      timestamp: Date.now(),
      cardInfo,
    };

    conv.messages.push(message);
    conv.updatedAt = Date.now();

    if (
      role === "user" &&
      conv.messages.filter((m) => m.role === "user").length === 1
    ) {
      conv.title = content.slice(0, 20) + (content.length > 20 ? "..." : "");
    }

    return message;
  }

  function updateLastAssistantMessage(content: string) {
    const conv = currentConversation.value;
    if (!conv) return;
    for (let i = conv.messages.length - 1; i >= 0; i--) {
      const msg = conv.messages[i];
      if (msg?.role === "assistant") {
        msg.content = content;
        break;
      }
    }
  }

  async function sendMessage(
    displayContent: string,
    sendContent: string,
    cardInfo?: DrawnCard[],
  ) {
    const conv = currentConversation.value ?? conversations.value[0] ?? null;
    if (!conv || isLoading.value) return;

    addMessage(displayContent, "user", cardInfo);
    isLoading.value = true;
    addMessage("", "assistant");

    try {
      if (!streamingEnabled.value) {
        // For now keep streaming as the primary path; non-stream can be added later.
      }

      if (!conv.serverSessionId) {
        for await (const ev of createSessionAndSendMessageStream(
          sendContent,
          selectedModel.value,
        )) {
          if (ev.kind === "session") {
            const oldId = conv.id;
            conv.serverSessionId = ev.session_id;
            conv.id = ev.session_id;
            // Remove any duplicated session entry from a previous refresh
            conversations.value = conversations.value.filter(
              (c) => c === conv || c.id !== ev.session_id,
            );
            if (currentConversationId.value === oldId) {
              currentConversationId.value = ev.session_id;
            }
          } else if (ev.kind === "chunk") {
            updateLastAssistantMessage(ev.content);
          }
        }
        return;
      }

      for await (const ev of sendMessageStream2Session(
        conv.serverSessionId,
        sendContent,
        selectedModel.value,
      )) {
        if (ev.kind === "chunk") {
          updateLastAssistantMessage(ev.content);
        }
      }
    } catch (err) {
      updateLastAssistantMessage(tGlobal("chat.error_try_later"));
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    conversations,
    currentConversationId,
    currentConversation,
    currentMessages,
    isLoading,
    selectedModel,
    streamingEnabled,
    ensureInitialized,
    refreshSessions,
    createConversation,
    deleteConversation,
    setCurrentConversation,
    addMessage,
    updateLastAssistantMessage,
    sendMessage,
  };
});
