import { expect, it } from "vitest";
import { cosine } from "./rag";
it("ranks embedding similarity and rejects incompatible or empty vectors", () => {
  expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
  expect(cosine([1, 0], [0, 1])).toBe(0);
  expect(cosine([1, 0], [-1, 0])).toBeCloseTo(-1);
  expect(cosine([0, 0], [1, 1])).toBe(0);
  expect(cosine([1], [1, 2])).toBe(0);
});
