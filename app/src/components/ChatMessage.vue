<script setup lang="ts">
import type { ChatMessage } from "../types";

const props = defineProps<{
  message: ChatMessage;
}>();

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div
    class="message-enter-active"
    :class="message.role === 'user' ? 'flex justify-end' : 'flex justify-start'"
  >
    <div
      class="max-w-[85%] sm:max-w-[75%]"
      :class="message.role === 'user' ? 'order-1' : 'order-2'"
    >
      <div
        class="flex items-center gap-2 mb-1"
        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <span class="text-xs text-base-content/60">
          {{ message.role === "user" ? "你" : "Raina" }}
        </span>
        <span class="text-xs text-base-content/40">{{
          formatTime(message.timestamp)
        }}</span>
      </div>

      <!-- 消息内容 -->
      <div
        class="rounded-2xl px-4 py-2"
        :class="
          message.role === 'user'
            ? 'bg-primary text-primary-content rounded-br-md'
            : 'bg-base-200 rounded-bl-md'
        "
      >
        <!-- 附加的塔罗牌信息 -->
        <div
          v-if="message.cardInfo && message.cardInfo.length > 0"
          class="flex items-center gap-1 mb-2 pb-2 border-b"
          :class="
            message.role === 'user'
              ? 'border-primary-content/20'
              : 'border-base-300'
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
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
          <span class="text-xs opacity-70"
            >已添加 {{ message.cardInfo.length }} 张塔罗牌信息</span
          >
        </div>

        <p class="whitespace-pre-wrap wrap-break-words">
          {{ message.content }}
        </p>
      </div>
    </div>
  </div>
</template>
