import { createFileRoute } from "@tanstack/react-router";
import { sessions } from "@/server/handlers";
export const Route = createFileRoute("/api/sessions/")({
  server: { handlers: { GET: sessions } },
});
