import { createFileRoute } from "@tanstack/react-router";
import { signIn } from "@/server/handlers";
export const Route = createFileRoute("/api/auth/login")({
  server: { handlers: { POST: signIn } },
});
