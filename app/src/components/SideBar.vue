<script setup lang="ts">
import { useChatStore } from "../stores/chat";
import { computed } from "vue";

const chatStore = useChatStore();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const conversations = computed(() => chatStore.conversations);
const currentId = computed(() => chatStore.currentConversationId);

function handleNewChat() {
  chatStore.createConversation();
  emit("close");
}

function selectConversation(id: string) {
  chatStore.setCurrentConversation(id);
  emit("close");
}

function deleteConversation(e: Event, id: string) {
  /* 防止事件冒泡 */
  e.stopPropagation();
  if (confirm("确定要删除这个对话吗？")) {
    chatStore.deleteConversation(id);
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "今天";
  if (days === 1) return "昨天";
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString("zh-CN");
}
</script>

<template>
  <div class="flex flex-col h-full bg-base-200">
    <!-- 新建对话按钮 -->
    <div class="p-4">
      <button class="btn btn-primary w-full gap-2" @click="handleNewChat">
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        新建对话
      </button>
    </div>

    <!-- 对话历史列表 -->
    <div class="flex-1 overflow-y-auto px-2">
      <div class="text-sm text-base-content/60 px-2 py-1">对话历史</div>

      <div
        v-if="conversations.length === 0"
        class="text-center text-base-content/40 py-8"
      >
        暂无对话记录
      </div>

      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="group relative flex items-center gap-2 px-3 py-2 mx-1 my-1 rounded-lg cursor-pointer transition-colors"
        :class="
          currentId === conv.id
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-base-300'
        "
        @click="selectConversation(conv.id)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>

        <div class="flex-1 min-w-0">
          <div class="truncate text-sm">{{ conv.title }}</div>
          <div class="text-xs text-base-content/40">
            {{ formatDate(conv.updatedAt) }}
          </div>
        </div>

        <!-- 删除按钮 -->
        <button
          class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
          @click="(e) => deleteConversation(e, conv.id)"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
