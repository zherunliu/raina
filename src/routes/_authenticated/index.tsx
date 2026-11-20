import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "@/components/chat-page";
export const Route = createFileRoute("/_authenticated/")({
  component: ChatPage,
});
