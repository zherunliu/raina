import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cards, drawCards, cardImage } from "./tarot";
describe("tarot deck", () => {
  it("ships all 78 distinct cards and their production images", () => {
    expect(cards).toHaveLength(78);
    expect(new Set(cards.map((card) => card.id)).size).toBe(78);
    for (const card of cards)
      expect(existsSync(`public${cardImage(card)}`), card.image).toBe(true);
  });
  it("draws a bounded spread without duplicate cards", () => {
    for (const count of [1, 3, 4, 5, 100]) {
      const result = drawCards(count);
      expect(result).toHaveLength(Math.min(count, 78));
      expect(new Set(result.map((draw) => draw.card.id)).size).toBe(
        result.length,
      );
    }
  });
});
