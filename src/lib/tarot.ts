import data from "@/resources/cards.json";
import type { AllTarotCards, DrawnCard, TarotCard } from "@/types";
export const cards = Object.values(data as AllTarotCards).flat() as TarotCard[];
export const cardImage = (card: TarotCard) => `/tarot/${card.image}`;
export function drawCards(count: number): DrawnCard[] {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck
    .slice(0, Math.max(0, Math.min(count, deck.length)))
    .map((card) => ({ card, isReversed: Math.random() < 0.5 }));
}
