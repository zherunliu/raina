import { createFileRoute } from "@tanstack/react-router";
import { documents, uploadDocument } from "@/server/handlers";
export const Route = createFileRoute("/api/documents/")({
  server: { handlers: { GET: documents, POST: uploadDocument } },
});
