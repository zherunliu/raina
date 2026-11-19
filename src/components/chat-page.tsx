import { useState, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Plus,
  Trash2,
  Send,
  Upload,
  Sparkles,
  Layers,
  BookOpen,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as api from "@/api";
import { useI18n } from "@/i18n";
import { useApp } from "./app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageList } from "./message-list";
import type { ChatMessage } from "@/types";

const historyKey = (id: string | null) => ["history", id] as const;
export function ChatPage() {
  const { t, locale } = useI18n();
  const {
    sending,
    setSending,
    sendingRef,
    requestRef,
    sessionId,
    setSessionId,
    sidebar,
    setSidebar,
    selectedCards,
    setSelectedCards,
    openTool,
  } = useApp();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [model, setModel] = useState<api.ModelType>("openai");
  const [streaming, setStreaming] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: api.getSessionsApi,
  });
  const history = useQuery({
    queryKey: historyKey(sessionId),
    enabled: !!sessionId && !sending,
    queryFn: async () => {
      const data = await api.getChatHistoryApi(sessionId!);
      return (data.history || []).map((message, i): ChatMessage => ({
        id: `${sessionId}-${i}`,
        role: message.role,
        content: message.content,
        timestamp: 0,
      }));
    },
  });
  const messages =
    queryClient.getQueryData<ChatMessage[]>(historyKey(sessionId)) ||
    history.data ||
    [];
  const deletion = useMutation({
    mutationFn: api.deleteSessionApi,
    onSuccess: async (_, id) => {
      if (sessionId === id) setSessionId(null);
      queryClient.removeQueries({ queryKey: historyKey(id) });
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const upload = useMutation({
    mutationFn: api.uploadFileApi,
    onSuccess: () =>
      toast.success(locale === "zh" ? "文档已上传" : "Document uploaded"),
    onError: (error) => toast.error(error.message),
  });
  async function send() {
    const text = input.trim();
    if (!text || sendingRef.current || history.isFetching) return;
    const controller = new AbortController();
    requestRef.current = controller;
    sendingRef.current = true;
    setSending(true);
    setInput("");
    let activeId = sessionId;
    const attached = [...selectedCards];
    setSelectedCards([]);
    let question = text;
    if (attached.length)
      question += t("chat.attached_cards_note", {
        cards: attached
          .map(
            (draw) =>
              `${locale === "en" ? draw.card.nameEn : draw.card.name}${t(draw.isReversed ? "tarot.reversed" : "tarot.upright")}`,
          )
          .join(", "),
      });
    await queryClient.cancelQueries({ queryKey: historyKey(activeId) });
    const user: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
      cardInfo: attached,
    };
    const assistant: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    queryClient.setQueryData<ChatMessage[]>(
      historyKey(activeId),
      (previous) => [...(previous || []), user, assistant],
    );
    function update(content: string) {
      if (controller.signal.aborted) return;
      queryClient.setQueryData<ChatMessage[]>(
        historyKey(activeId),
        (previous) =>
          (previous || []).map((message) =>
            message.id === assistant.id ? { ...message, content } : message,
          ),
      );
    }
    function assignSession(id: string) {
      if (controller.signal.aborted) return;
      const previousKey = historyKey(activeId);
      queryClient.setQueryData(
        historyKey(id),
        queryClient.getQueryData(previousKey),
      );
      if (activeId !== id) queryClient.removeQueries({ queryKey: previousKey });
      activeId = id;
      setSessionId(id);
    }
    try {
      if (streaming) {
        const stream = api.streamChat(
          question,
          model,
          activeId || undefined,
          controller.signal,
        );
        for await (const event of stream) {
          if (event.kind === "session") assignSession(event.session_id);
          else if (event.kind === "chunk") update(event.content);
        }
      } else {
        const result = await api.sendChat(
          question,
          model,
          activeId || undefined,
          controller.signal,
        );
        if (result.session_id) assignSession(result.session_id);
        update(result.answer || "");
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      const message =
        error instanceof Error ? error.message : t("chat.error_try_later");
      update(message);
      toast.error(message);
    } finally {
      // One cache owns both loaded history and optimistic messages; refetches replace it, never append duplicates.
      sendingRef.current = false;
      setSending(false);
      if (!controller.signal.aborted)
        await queryClient.invalidateQueries({ queryKey: ["sessions"] });
      if (requestRef.current === controller) requestRef.current = null;
    }
  }
  const error = sessions.error || history.error;
  return (
    <div className="relative flex h-full min-h-0">
      {sidebar && (
        <>
          <button
            className="absolute inset-0 z-20 bg-black/30 lg:hidden"
            aria-label={t("common.close")}
            onClick={() => setSidebar(false)}
          />
          <aside className="bg-card absolute inset-y-0 left-0 z-30 flex w-72 flex-col border-r p-4 lg:relative lg:z-auto">
            <div className="flex items-center gap-2">
              <Button
                className="flex-1"
                disabled={sending}
                onClick={() => {
                  setSessionId(null);
                  queryClient.removeQueries({ queryKey: historyKey(null) });
                  setSelectedCards([]);
                  setSidebar(false);
                }}
              >
                <Plus />
                {t("sidebar.new_chat")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("common.close")}
                onClick={() => setSidebar(false)}
              >
                <X />
              </Button>
            </div>
            <h2 className="text-muted-foreground mt-6 mb-3 text-xs">
              {t("sidebar.history")}
            </h2>
            <div className="min-h-0 flex-1 overflow-auto">
              {sessions.isPending && (
                <p className="text-sm">{t("common.loading")}</p>
              )}
              {sessions.data?.sessions?.map((session) => (
                <div
                  key={session.id}
                  className={`my-1 flex items-center rounded-lg ${sessionId === session.id ? "bg-muted" : ""}`}
                >
                  <Button
                    variant="ghost"
                    className="min-w-0 flex-1 justify-start"
                    disabled={sending}
                    onClick={() => {
                      setSessionId(session.id);
                      setSidebar(false);
                    }}
                  >
                    <span className="truncate">
                      {session.title || t("sidebar.new_chat")}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${t("common.delete")} ${session.title || ""}`}
                    disabled={sending || deletion.isPending}
                    onClick={() => {
                      if (window.confirm(t("sidebar.delete_confirm")))
                        deletion.mutate(session.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              {sessions.data?.sessions?.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  {t("sidebar.empty")}
                </p>
              )}
            </div>
          </aside>
        </>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {error && (
          <div
            role="alert"
            className="text-destructive flex items-center justify-center gap-3 p-2 text-sm"
          >
            {error.message}
            <Button
              variant="outline"
              onClick={() => {
                void sessions.refetch();
                if (sessionId) void history.refetch();
              }}
            >
              {locale === "zh" ? "重试" : "Retry"}
            </Button>
          </div>
        )}
        {messages.length ? (
          <MessageList messages={messages} sending={sending} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto px-6 py-8 text-center">
            <img
              src="/hexagram.png"
              alt=""
              className="mb-7 size-16 opacity-70"
            />
            <h1 className="text-2xl leading-relaxed font-medium sm:text-3xl">
              {t("chat.empty_title")}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-md text-sm leading-7">
              {t("chat.empty_desc")}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => openTool("daily")}>
                <Sparkles />
                {t("chat.today_fortune")}
              </Button>
              <Button variant="outline" onClick={() => openTool("spread")}>
                <Layers />
                {t("chat.choose_spread")}
              </Button>
              <Button variant="outline" render={<Link to="/explore" />}>
                <BookOpen />
                {t("chat.explore_cards")}
              </Button>
            </div>
            {history.isFetching && (
              <p className="mt-4 text-sm">{t("common.loading")}</p>
            )}
          </div>
        )}
        <form
          className="mx-auto w-full max-w-3xl shrink-0 px-4 pt-3 pb-5 sm:px-6"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="text-muted-foreground mb-3 flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-2">
              {t("chat.model")}
              <select
                className="bg-background text-foreground rounded-md border p-1.5"
                value={model}
                onChange={(e) => setModel(e.target.value as api.ModelType)}
                disabled={sending}
              >
                <option value="openai">{t("chat.openai")}</option>
                <option value="openai-rag">{t("chat.openai_rag")}</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={streaming}
                onChange={(e) => setStreaming(e.target.checked)}
                disabled={sending}
              />
              {t("chat.streaming")}
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={upload.isPending}
              onClick={() => fileInput.current?.click()}
            >
              <Upload />
              {t("chat.upload_doc")}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".md,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload.mutate(file);
                e.target.value = "";
              }}
            />
          </div>
          {selectedCards.length > 0 && (
            <div className="bg-muted mb-3 flex flex-wrap items-center gap-2 rounded-lg p-2 text-xs">
              {selectedCards.map((draw) => (
                <span key={draw.card.id}>
                  {locale === "en" ? draw.card.nameEn : draw.card.name}
                  {t(draw.isReversed ? "tarot.reversed" : "tarot.upright")}
                </span>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => setSelectedCards([])}
              >
                {t("common.clear")}
              </Button>
            </div>
          )}
          <div className="bg-card flex items-end gap-2 rounded-xl border p-2 shadow-sm">
            <Textarea
              className="min-h-12 resize-none border-0 shadow-none focus-visible:ring-0"
              aria-label={t("chat.input_placeholder")}
              placeholder={t("chat.input_placeholder")}
              value={input}
              rows={2}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button
              type="submit"
              size="icon-lg"
              aria-label={locale === "zh" ? "发送" : "Send"}
              disabled={sending || !input.trim() || history.isFetching}
            >
              <Send />
            </Button>
          </div>
          <p className="text-muted-foreground mt-2 text-center text-xs">
            {sending ? t("chat.thinking") : t("chat.send_hint")}
          </p>
        </form>
      </div>
    </div>
  );
}
