import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthPage } from "@/components/auth-page";
import { getSession } from "@/lib/session";
export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search.redirect === "string" && /^\/(?!\/)/.test(search.redirect)
        ? search.redirect
        : "/",
  }),
  beforeLoad: async () => {
    if (await getSession()) throw redirect({ to: "/" });
  },
  component: () => <AuthPage register={false} />,
});
