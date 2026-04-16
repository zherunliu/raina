<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useChatStore } from "../stores/chat";
import { useUiStore } from "../stores/ui";
import { storeToRefs } from "pinia";
import { Blocks, Search, SendHorizontal, Sparkles } from "lucide-vue-next";
import { uploadFileApi } from "../api";
import VirtualMessageList from "../components/VirtualMessageList.vue";
import { useI18n } from "vue-i18n";

const chatStore = useChatStore();
const { refreshSessions } = chatStore;
const uiStore = useUiStore();
const { t, locale } = useI18n();

onMounted(refreshSessions);

const inputMessage = ref("");
const inputRef = ref<HTMLTextAreaElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const selectedCards = storeToRefs(uiStore).selectedToolCards;

async function sendMessage() {
  const content = inputMessage.value;
  if (!content || chatStore.isLoading) return;

  inputMessage.value = "";

  const cardInfo =
    selectedCards.value.length > 0 ? [...selectedCards.value] : undefined;
  let sendContent = content;
  if (selectedCards.value.length > 0) {
    const cardsInfo = selectedCards.value
      .map((card) => {
        const name = locale.value.startsWith("en")
          ? card.card.nameEn
          : card.card.name;
        return `${name}${card.isReversed ? t("tarot.reversed") : ""}`;
      })
      .join(", ");
    sendContent += t("chat.attached_cards_note", { cards: cardsInfo });
  }

  selectedCards.value = [];
  uiStore.clearToolCards();

  try {
    await chatStore.sendMessage(content, sendContent, cardInfo);
  } catch {
    // store 层已做兜底，这里保留空 catch 避免控制台噪音
  }
}

function triggerUpload() {
  fileInputRef.value?.click();
}

async function onUploadChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const res = await uploadFileApi(file);
    if (res.code !== 1000) {
      console.error(res.message ?? t("common.upload_failed"));
    }
  } finally {
    input.value = "";
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    void sendMessage();
  }
}

function adjustTextareaHeight() {
  if (inputRef.value) {
    inputRef.value.style.height = "auto";
    inputRef.value.style.height = `${Math.min(inputRef.value.scrollHeight, 150)}px`;
  }
}

onMounted(async () => {
  await chatStore.ensureInitialized();
  if (chatStore.currentConversationId) {
    await chatStore.setCurrentConversation(chatStore.currentConversationId);
  }
});
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 消息列表区域 -->
    <div class="flex-1">
      <div
        v-if="chatStore.currentMessages.length === 0"
        class="flex h-full flex-col items-center justify-center overflow-y-auto p-4 px-4 text-center"
      >
        <div class="mb-8">
          <h2 class="mb-2 text-2xl font-bold">{{ t("chat.empty_title") }}</h2>
          <p class="text-base-content/60 max-w-md">
            {{ t("chat.empty_desc") }}
          </p>
        </div>

        <div class="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
            @click="uiStore.openFortuneModal()"
          >
            <div class="card-body items-center py-6">
              <Sparkles class="text-warning mb-2 h-8 w-8" />
              <span class="font-medium">{{ t("chat.today_fortune") }}</span>
              <span class="text-base-content/60 text-xs">{{
                t("tarot.daily_title")
              }}</span>
            </div>
          </button>

          <button
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
            @click="uiStore.openToolsModal()"
          >
            <div class="card-body items-center py-6">
              <Blocks class="text-secondary mb-2 h-8 w-8" />
              <span class="font-medium">{{ t("chat.choose_spread") }}</span>
              <span class="text-base-content/60 text-xs">{{
                t("nav.spreads")
              }}</span>
            </div>
          </button>

          <router-link
            to="/explore"
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
          >
            <div class="card-body items-center py-6">
              <Search class="text-accent mb-2 h-8 w-8" />
              <span class="font-medium">{{ t("chat.explore_cards") }}</span>
              <span class="text-base-content/60 text-xs">{{
                t("explore.title")
              }}</span>
            </div>
          </router-link>
        </div>
      </div>

      <VirtualMessageList
        v-else
        :messages="chatStore.currentMessages"
        :loading="chatStore.isLoading"
      />
    </div>

    <!-- 输入区域 -->
    <div class="bg-base-100 p-4">
      <div class="mx-auto max-w-3xl">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <select
            v-model="chatStore.selectedModel"
            class="select select-bordered select-sm"
          >
            <option value="ollama">{{ t("chat.ollama") }}</option>
            <option value="ollama-rag">{{ t("chat.ollama_rag") }}</option>
          </select>

          <label class="text-base-content/70 flex items-center gap-2 text-sm">
            <input
              v-model="chatStore.streamingEnabled"
              type="checkbox"
              class="checkbox checkbox-sm"
            />
            {{ t("chat.streaming") }}
          </label>

          <button class="btn btn-ghost btn-sm" @click="triggerUpload">
            {{ t("chat.upload_doc") }}
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".md,.txt"
            class="hidden"
            @change="onUploadChange"
          />
        </div>
        <div class="flex items-end gap-2">
          <div class="relative flex-1">
            <!-- 已加入的卡牌 -->
            <div
              v-if="uiStore.toolMode"
              class="bg-base-200/50 mb-2 inline-flex flex-wrap items-center gap-2 rounded-lg p-2"
            >
              <span class="text-base-content/60 text-sm">{{
                t("chat.selected")
              }}</span>
              <div
                v-for="(drawnCard, index) in uiStore.selectedToolCards"
                :key="index"
                class="badge badge-primary gap-1"
              >
                {{
                  locale.startsWith("en")
                    ? drawnCard.card.nameEn
                    : drawnCard.card.name
                }}
                <span v-if="drawnCard.isReversed" class="text-xs">{{
                  t("tarot.reversed")
                }}</span>
              </div>
              <button
                class="btn btn-ghost btn-xs"
                @click="uiStore.clearToolCards()"
              >
                {{ t("chat.clear_selected") }}
              </button>
            </div>
            <textarea
              ref="inputRef"
              v-model="inputMessage"
              class="textarea textarea-bordered min-h-44px max-h-150px w-full resize-none pr-12"
              :placeholder="t('chat.input_placeholder')"
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
            <SendHorizontal class="h-5 w-5" />
          </button>
        </div>
        <p class="text-base-content/40 mt-2 text-center text-xs">
          {{ t("chat.send_hint") }}
        </p>
      </div>
    </div>
  </div>
</template>
