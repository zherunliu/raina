<script setup lang="ts">
import type { ChatMessage } from "../types";
import { computed } from "vue";
import { Blocks } from "lucide-vue-next";
import { marked } from "marked";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  message: ChatMessage;
}>();

const { t, locale } = useI18n();

marked.setOptions({
  breaks: true,
  gfm: true,
});

function formatTime(timestamp: number): string {
  const loc = locale.value.startsWith("zh") ? "zh-CN" : "en-US";
  return new Date(timestamp).toLocaleTimeString(loc, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const renderedContent = computed(() =>
  marked.parse(props.message.content || ""),
);
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
        class="mb-1 flex items-center gap-2"
        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <span class="text-base-content/60 text-xs">
          {{ message.role === "user" ? t("chat.you") : t("chat.raina") }}
        </span>
        <span class="text-base-content/40 text-xs">{{
          formatTime(message.timestamp)
        }}</span>
      </div>

      <!-- 消息内容 -->
      <div
        v-if="message.content"
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
          class="mb-2 flex items-center gap-1 border-b pb-2"
          :class="
            message.role === 'user'
              ? 'border-primary-content/20'
              : 'border-base-300'
          "
        >
          <Blocks class="h-4 w-4" />
          <span class="text-xs opacity-70">{{
            t("chat.added_cards", { count: message.cardInfo.length })
          }}</span>
        </div>

        <div
          v-if="message.role === 'assistant'"
          class="wrap-break-words max-w-none leading-loose [&>p]:my-3"
          v-html="renderedContent"
        ></div>
        <div
          v-else
          class="wrap-break-words max-w-none leading-loose whitespace-pre-wrap"
        >
          {{ message.content }}
        </div>
      </div>
    </div>
  </div>
</template>
