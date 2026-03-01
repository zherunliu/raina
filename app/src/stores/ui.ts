import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { DrawnCard } from "../types";

export const useUiStore = defineStore("ui", () => {
  /* toolModal states */
  const selectedToolCards = ref<DrawnCard[]>([]);
  const showToolsModal = ref(false);
  const toolMode = computed(() => selectedToolCards.value.length > 0);

  function openToolsModal() {
    showToolsModal.value = true;
  }

  function closeToolsModal() {
    showToolsModal.value = false;
  }

  function confirmToolCards(cards: DrawnCard[]) {
    selectedToolCards.value = cards;
    showToolsModal.value = false;
  }

  function clearToolCards() {
    selectedToolCards.value = [];
  }

  /* FortuneModal states */
  const showFortuneModal = ref(false);

  function openFortuneModal() {
    showFortuneModal.value = true;
  }

  function closeFortuneModal() {
    showFortuneModal.value = false;
  }

  return {
    selectedToolCards,
    showToolsModal,
    toolMode,
    openToolsModal,
    closeToolsModal,
    confirmToolCards,
    clearToolCards,
    showFortuneModal,
    openFortuneModal,
    closeFortuneModal,
  };
});
