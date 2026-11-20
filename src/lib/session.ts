import { createServerFn } from "@tanstack/react-start";
export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { currentUser } = await import("@/server/auth");
    return Boolean(await currentUser());
  },
);
export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { clearSession } = await import("@/server/auth");
  clearSession();
});
