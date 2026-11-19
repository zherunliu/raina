import { createFileRoute } from "@tanstack/react-router";
import { removeDocument } from "@/server/handlers";
export const Route = createFileRoute("/api/documents/$filename")({
  server: { handlers: { DELETE: removeDocument } },
});
