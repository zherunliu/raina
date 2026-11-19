import { createFileRoute } from "@tanstack/react-router";
import { signOut } from "@/server/handlers";
export const Route = createFileRoute("/api/auth/logout")({
  server: { handlers: { POST: signOut } },
});
