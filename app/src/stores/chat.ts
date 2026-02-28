import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { ChatMessage, Conversation, DrawnCard } from "../types";

export const useChatStore = defineStore("chat", () => {
  const conversations = ref<Conversation[]>([]);
  const currentConversationId = ref<string | null>(null);
  const isLoading = ref(false);

  const currentConversation = computed(() =>
    conversations.value.find((c) => c.id === currentConversationId.value),
  );

  const currentMessages = computed(
    () => currentConversation.value?.messages ?? [],
  );

  function createConversation(title: string = "新对话"): string {
    const id = Date.now().toString();
    const conversation: Conversation = {
      id,
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    conversations.value.unshift(conversation);
    currentConversationId.value = id;
    return id;
  }

  function deleteConversation(id: string) {
    const index = conversations.value.findIndex((c) => c.id === id);
    if (index > -1) {
      conversations.value.splice(index, 1);
      if (currentConversationId.value === id) {
        currentConversationId.value = conversations.value[0]?.id ?? null;
      }
    }
  }

  function setCurrentConversation(id: string) {
    currentConversationId.value = id;
  }

  function addMessage(
    content: string,
    role: "user" | "assistant" | "system",
    cardInfo?: DrawnCard[],
  ) {
    if (!currentConversation.value) {
      createConversation();
    }

    const message: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: Date.now(),
      cardInfo,
    };

    currentConversation.value!.messages.push(message);
    currentConversation.value!.updatedAt = Date.now();

    if (
      role === "user" &&
      currentConversation.value!.messages.filter((m) => m.role === "user")
        .length === 1
    ) {
      currentConversation.value!.title =
        content.slice(0, 20) + (content.length > 20 ? "..." : "");
    }

    return message;
  }

  function updateLastAssistantMessage(content: string) {
    if (!currentConversation.value) return;

    const messages = currentConversation.value.messages;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg && msg.role === "assistant") {
        msg.content = content;
        break;
      }
    }
  }

  return {
    conversations,
    currentConversationId,
    currentConversation,
    currentMessages,
    isLoading,
    createConversation,
    deleteConversation,
    setCurrentConversation,
    addMessage,
    updateLastAssistantMessage,
  };
});
