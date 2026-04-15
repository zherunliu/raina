import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { AllTarotCards, TarotCard, DrawnCard } from "../types";
import tarotData from "../resources/cards.json";

export const allTarotCards: AllTarotCards = tarotData as AllTarotCards;

export const useTarotStore = defineStore("tarot", () => {
  const cards = ref<TarotCard[]>(
    allTarotCards.majorArcana.concat(
      allTarotCards.wands,
      allTarotCards.cups,
      allTarotCards.swords,
      allTarotCards.pentacles,
    ),
  );

  function drawCards(count = 1): DrawnCard[] {
    const shuffled = [...cards.value].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((card) => ({
      card,
      isReversed: Math.random() > 0.5,
    }));
  }

  function getCardById(id: number): TarotCard | undefined {
    return cards.value.find((card) => card.id === id);
  }

  const majorArcanaCards = computed(() =>
    cards.value.filter((c) => c.type === "major"),
  );
  const minorArcanaCards = computed(() =>
    cards.value.filter((c) => c.type === "minor"),
  );

  const cardsBySuit = computed(() => ({
    major: majorArcanaCards.value,
    wands: cards.value.filter((c) => c.suit === "wands"),
    cups: cards.value.filter((c) => c.suit === "cups"),
    swords: cards.value.filter((c) => c.suit === "swords"),
    pentacles: cards.value.filter((c) => c.suit === "pentacles"),
  }));

  return {
    cards,
    drawCards,
    getCardById,
    majorArcanaCards,
    minorArcanaCards,
    cardsBySuit,
  };
});
