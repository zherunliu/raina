import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./auth";
describe("password storage", () => {
  it("uses a unique salt and verifies only the matching password", async () => {
    const first = await hashPassword("password");
    const second = await hashPassword("password");
    expect(first).not.toBe(second);
    expect(first).not.toContain("password");
    expect(await verifyPassword("password", first)).toBe(true);
    expect(await verifyPassword("incorrect", first)).toBe(false);
  });
  it("rejects malformed and legacy hashes", async () => {
    for (const hash of [
      "",
      "scrypt:invalid:xyz",
      "5f4dcc3b5aa765d61d8327deb882cf99",
    ])
      expect(await verifyPassword("password", hash)).toBe(false);
  });
});
