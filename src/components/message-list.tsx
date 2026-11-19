import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ChatMessage } from "@/types";
import { useI18n } from "@/i18n";
import { Markdown } from "./markdown";
export function MessageList({
  messages,
  sending,
}: {
  messages: ChatMessage[];
  sending: boolean;
}) {
  const { t, locale } = useI18n();
  const parent = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parent.current,
    estimateSize: () => 140,
    overscan: 6,
  });
  const lastContent = messages.at(-1)?.content;
  useEffect(() => {
    if (!follow.current) return;
    const id = requestAnimationFrame(() =>
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" }),
    );
    return () => cancelAnimationFrame(id);
  }, [messages.length, lastContent, virtualizer]);
  return (
    <div
      ref={parent}
      className="min-h-0 flex-1 overflow-auto px-4"
      role="log"
      aria-label={t("sidebar.history")}
      aria-busy={sending}
      onScroll={() => {
        const node = parent.current;
        if (node)
          follow.current =
            node.scrollHeight - node.scrollTop - node.clientHeight < 100;
      }}
    >
      <div
        className="relative mx-auto max-w-3xl"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const message = messages[item.index];
          return (
            <div
              key={message.id}
              data-index={item.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full py-4"
              style={{ transform: `translateY(${item.start}px)` }}
            >
              <article
                className={
                  message.role === "user"
                    ? "bg-secondary ml-auto max-w-[85%] rounded-2xl p-4"
                    : "mr-auto max-w-full px-2 py-3"
                }
              >
                <p className="text-muted-foreground mb-2 text-xs">
                  {t(message.role === "user" ? "chat.you" : "chat.raina")}
                </p>
                {message.cardInfo?.length ? (
                  <p className="mb-2 text-xs">
                    {message.cardInfo
                      .map(
                        (draw) =>
                          `${locale === "en" ? draw.card.nameEn : draw.card.name}${t(draw.isReversed ? "tarot.reversed" : "tarot.upright")}`,
                      )
                      .join(", ")}
                  </p>
                ) : null}
                {message.role === "assistant" ? (
                  message.content ? (
                    <Markdown>{message.content}</Markdown>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {t("chat.thinking")}
                    </p>
                  )
                ) : (
                  <p className="leading-7 wrap-anywhere whitespace-pre-wrap">
                    {message.content}
                  </p>
                )}
              </article>
            </div>
          );
        })}
      </div>
    </div>
  );
}
