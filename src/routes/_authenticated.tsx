import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (!(await getSession()))
      throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: AppShell,
});
