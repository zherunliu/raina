<script setup lang="ts">
import { useChatStore } from "../stores/chat";
import { computed } from "vue";
import { useMediaQuery } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { MessageSquare, Plus, Trash2 } from "lucide-vue-next";

/* 也可以使用 window.innerWidth 判断 */
const isLargeScreen = useMediaQuery("(min-width: 1024px)");

const chatStore = useChatStore();
const { t } = useI18n();

const emit = defineEmits<(e: "close") => void>();

const conversations = computed(() => chatStore.conversations);
const currentId = computed(() => chatStore.currentConversationId);

function handleNewChat() {
  chatStore.createConversation();
  if (!isLargeScreen.value) {
    emit("close");
  }
}

function selectConversation(id: string) {
  void chatStore.setCurrentConversation(id);
  if (!isLargeScreen.value) {
    emit("close");
  }
}

function deleteConversation(e: Event, id: string) {
  /* 防止事件冒泡 */
  e.stopPropagation();
  if (confirm(t("sidebar.delete_confirm"))) {
    void chatStore.deleteConversation(id);
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return t("sidebar.today");
  if (days === 1) return t("sidebar.yesterday");
  if (days < 7) return t("sidebar.days_ago", { days });
  return date.toLocaleDateString();
}
</script>

<template>
  <div class="bg-base-200 flex h-full flex-col">
    <!-- 新建对话按钮 -->
    <div class="p-4">
      <button class="btn btn-primary w-full gap-2" @click="handleNewChat">
        <Plus class="h-5 w-5" />
        {{ t("sidebar.new_chat") }}
      </button>
    </div>

    <!-- 对话历史列表 -->
    <div class="flex-1 overflow-y-auto px-2">
      <div class="text-base-content/60 px-2 py-1 text-sm">
        {{ t("sidebar.history") }}
      </div>

      <div
        v-if="conversations.length === 0"
        class="text-base-content/40 py-8 text-center"
      >
        {{ t("sidebar.empty") }}
      </div>

      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="group relative mx-1 my-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors"
        :class="
          currentId === conv.id
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-base-300'
        "
        @click="selectConversation(conv.id)"
      >
        <MessageSquare class="h-4 w-4 shrink-0" />

        <div class="min-w-0 flex-1">
          <div class="truncate text-sm">{{ conv.title }}</div>
          <div class="text-base-content/40 text-xs">
            {{ formatDate(conv.updatedAt) }}
          </div>
        </div>

        <!-- 删除按钮 -->
        <button
          class="btn btn-ghost btn-xs opacity-0 transition-opacity group-hover:opacity-100"
          @click="(e) => deleteConversation(e, conv.id)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
