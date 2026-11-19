import { createFileRoute } from "@tanstack/react-router";
import { signUp } from "@/server/handlers";
export const Route = createFileRoute("/api/auth/register")({
  server: { handlers: { POST: signUp } },
});
