<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import { useChatStore } from "../stores/chat";
import { useUiStore } from "../stores/ui";
import type { DrawnCard } from "../types";
import ChatMessage from "../components/ChatMessage.vue";
import { chatStreamApi } from "../api";

const chatStore = useChatStore();
const uiStore = useUiStore();

const inputMessage = ref("");
const messageContainer = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);

const selectedCards = ref<DrawnCard[]>([]);

function scrollToBottom() {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
}

watch(() => chatStore.currentMessages.length, scrollToBottom);

async function sendMessage() {
  const content = inputMessage.value.trim();
  if (!content || chatStore.isLoading) return;

  inputMessage.value = "";

  chatStore.addMessage(
    content,
    "user",
    selectedCards.value.length > 0 ? [...selectedCards.value] : undefined,
  );

  selectedCards.value = [];
  uiStore.clearToolCards();

  chatStore.isLoading = true;
  chatStore.addMessage("", "assistant");

  try {
    let currentText = "";
    for await (const chunk of chatStreamApi(content)) {
      currentText += chunk;
      chatStore.updateLastAssistantMessage(currentText);
    }
  } catch (error) {
    chatStore.updateLastAssistantMessage("抱歉，发生了错误，请稍后重试。");
  } finally {
    chatStore.isLoading = false;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function adjustTextareaHeight() {
  if (inputRef.value) {
    inputRef.value.style.height = "auto";
    inputRef.value.style.height =
      Math.min(inputRef.value.scrollHeight, 150) + "px";
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 消息列表区域 -->
    <div ref="messageContainer" class="flex-1 overflow-y-auto p-4">
      <!-- 空状态欢迎页面 -->
      <div
        v-if="chatStore.currentMessages.length === 0"
        class="h-full flex flex-col items-center justify-center text-center px-4"
      >
        <div class="mb-8">
          <h2 class="text-2xl font-bold mb-2">你好，今天感觉怎么样？</h2>
          <p class="text-base-content/60 max-w-md">
            探索塔罗的神秘世界，获取今日运势，或与AI讨论您的问题
          </p>
        </div>

        <!-- 快捷操作 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          <button
            class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
            @click="uiStore.openFortuneModal()"
          >
            <div class="card-body items-center py-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-warning mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span class="font-medium">今日运势</span>
              <span class="text-xs text-base-content/60">抽取每日塔罗牌</span>
            </div>
          </button>

          <button
            class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
            @click="uiStore.openToolsModal()"
          >
            <div class="card-body items-center py-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-secondary mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span class="font-medium">选择牌阵</span>
              <span class="text-xs text-base-content/60">抽卡后与 AI 讨论</span>
            </div>
          </button>

          <router-link
            to="/explore"
            class="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
          >
            <div class="card-body items-center py-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-accent mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span class="font-medium">探索牌义</span>
              <span class="text-xs text-base-content/60">查看塔罗图鉴</span>
            </div>
          </router-link>
        </div>
      </div>

      <!-- 消息列表 -->
      <div v-else class="max-w-3xl mx-auto space-y-4">
        <ChatMessage
          v-for="message in chatStore.currentMessages"
          :key="message.id"
          :message="message"
        />

        <!-- 加载指示器 -->
        <div
          v-if="chatStore.isLoading"
          class="flex items-center gap-2 text-base-content/60"
        >
          <span class="loading loading-dots loading-sm"></span>
          <span class="text-sm">thinking...</span>
        </div>
      </div>
    </div>

    <!-- 已加入的卡牌 -->
    <div
      v-if="uiStore.toolMode"
      class="px-4 py-2 bg-base-200/50 border-t border-base-300"
    >
      <div class="max-w-3xl mx-auto flex items-center gap-2 flex-wrap">
        <span class="text-sm text-base-content/60">已选择:</span>
        <div
          v-for="(drawnCard, index) in uiStore.selectedToolCards"
          :key="index"
          class="badge badge-primary gap-1"
        >
          {{ drawnCard.card.name }}
          <span v-if="drawnCard.isReversed" class="text-xs">(逆位)</span>
        </div>
        <button class="btn btn-ghost btn-xs" @click="uiStore.clearToolCards()">
          清除
        </button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="p-4 bg-base-100">
      <div class="max-w-3xl mx-auto">
        <div class="flex items-end gap-2">
          <div class="flex-1 relative">
            <textarea
              ref="inputRef"
              v-model="inputMessage"
              class="textarea textarea-bordered w-full resize-none min-h-44px max-h-150px pr-12"
              placeholder="输入您的问题..."
              rows="1"
              @keydown="handleKeydown"
              @input="adjustTextareaHeight"
            ></textarea>
          </div>
          <button
            class="btn btn-primary btn-square"
            :disabled="!inputMessage.trim() || chatStore.isLoading"
            @click="sendMessage"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p class="text-xs text-base-content/40 mt-2 text-center">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  </div>
</template>
