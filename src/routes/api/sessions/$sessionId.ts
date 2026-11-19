import { createFileRoute } from "@tanstack/react-router";
import {
  sessionHistory,
  renameSession,
  removeSession,
} from "@/server/handlers";
export const Route = createFileRoute("/api/sessions/$sessionId")({
  server: {
    handlers: {
      GET: sessionHistory,
      PATCH: renameSession,
      DELETE: removeSession,
    },
  },
});
