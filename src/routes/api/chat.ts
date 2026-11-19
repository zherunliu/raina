import { createFileRoute } from "@tanstack/react-router";
import { chat } from "@/server/handlers";
export const Route = createFileRoute("/api/chat")({
  server: { handlers: { POST: chat } },
});
