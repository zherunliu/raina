<script setup lang="ts">
import { ref } from "vue";
import ChatInterface from "../components/ChatInterface.vue";
import FortuneModal from "../components/FortuneModal.vue";
import ToolsModal from "../components/ToolsModal.vue";
import type { DrawnCard } from "../types";

const showFortuneModal = ref(false);
const showToolsModal = ref(false);

const selectedToolCards = ref<DrawnCard[]>([]);

function handleToolConfirm(cards: DrawnCard[]) {
  selectedToolCards.value = cards;
  showToolsModal.value = false;
}

function clearToolCards() {
  selectedToolCards.value = [];
}
</script>

<template>
  <div class="h-full flex flex-col">
    <ChatInterface
      :tool-mode="selectedToolCards.length > 0"
      :selected-tool-cards="selectedToolCards"
      @open-fortune="showFortuneModal = true"
      @open-tools="showToolsModal = true"
      @clear-tool-cards="clearToolCards"
    />

    <FortuneModal v-if="showFortuneModal" @close="showFortuneModal = false" />

    <ToolsModal
      v-if="showToolsModal"
      @close="showToolsModal = false"
      @confirm="handleToolConfirm"
    />
  </div>
</template>
