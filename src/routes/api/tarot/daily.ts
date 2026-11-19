import { createFileRoute } from "@tanstack/react-router";
import { tarotDaily } from "@/server/handlers";
export const Route = createFileRoute("/api/tarot/daily")({
  server: { handlers: { POST: tarotDaily } },
});
