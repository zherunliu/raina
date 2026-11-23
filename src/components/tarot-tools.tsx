import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { getLocale } from "@/i18n";
import { drawCards, cardImage } from "@/lib/tarot";
import { tarotDailyApi } from "@/api";
import type { DrawnCard } from "@/types";
import { Markdown } from "./markdown";
export function TarotTools({
  mode,
  close,
  confirm,
}: {
  mode: "daily" | "spread";
  close: () => void;
  confirm: (cards: DrawnCard[]) => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.resolvedLanguage);
  const [count, setCount] = useState(3);
  const [drawn, setDrawn] = useState<DrawnCard[]>(() =>
    mode === "daily" ? drawCards(1) : [],
  );
  const [revealed, setRevealed] = useState<number[]>([]);
  const interpretation = useMutation({
    mutationFn: async (card: DrawnCard) =>
      tarotDailyApi(
        `${locale === "en" ? card.card.nameEn : card.card.name}${t(card.isReversed ? "tarot.reversed" : "tarot.upright")}`,
      ),
  });
  function reveal(index: number) {
    if (revealed.includes(index)) return;
    setRevealed((values) => [...values, index]);
    if (mode === "daily") interpretation.mutate(drawn[index]);
  }
  const allRevealed = drawn.length > 0 && revealed.length === drawn.length;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
        <DialogTitle>
          {t(mode === "daily" ? "tarot.daily_title" : "tools.title")}
        </DialogTitle>
        <DialogDescription>
          {t(mode === "daily" ? "tarot.flip_to_reveal" : "tools.desc")}
        </DialogDescription>
        {mode === "spread" && (
          <div className="flex flex-wrap gap-2">
            {[1, 3, 4, 5].map((n, i) => (
              <Button
                key={n}
                variant={count === n ? "default" : "outline"}
                onClick={() => {
                  setCount(n);
                  setDrawn([]);
                  setRevealed([]);
                }}
              >
                {t(
                  `tools.spreads.${["single", "timeline", "relationship", "cross"][i]}`,
                )}
              </Button>
            ))}
            <Button
              onClick={() => {
                setDrawn(drawCards(count));
                setRevealed([]);
              }}
            >
              {t(drawn.length ? "tools.reselect" : "tools.start_draw")}
            </Button>
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-4 py-5">
          {drawn.map((draw, i) => (
            <div key={draw.card.id} className="w-28 text-center">
              <button
                className="bg-secondary relative aspect-[3/5] w-full overflow-hidden rounded-lg border shadow-md"
                onClick={() => reveal(i)}
                aria-label={
                  revealed.includes(i)
                    ? draw.card.nameEn
                    : t("tarot.flip_to_reveal")
                }
              >
                <img
                  src={
                    revealed.includes(i)
                      ? cardImage(draw.card)
                      : "/tarot/The_back.jpg"
                  }
                  alt={revealed.includes(i) ? draw.card.nameEn : ""}
                  className={`h-full w-full object-cover ${revealed.includes(i) && draw.isReversed ? "rotate-180" : ""}`}
                />
              </button>
              {revealed.includes(i) && (
                <>
                  <p className="mt-2 text-sm font-medium">
                    {locale === "en" ? draw.card.nameEn : draw.card.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t(
                      draw.isReversed
                        ? "tarot.reversed_plain"
                        : "tarot.upright_plain",
                    )}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
        {mode === "spread" && drawn.length > 0 && !allRevealed && (
          <Button
            variant="outline"
            onClick={() => setRevealed(drawn.map((_, i) => i))}
          >
            {t("tools.reveal_all")}
          </Button>
        )}
        {drawn
          .filter((_, i) => revealed.includes(i))
          .map((draw) => (
            <p key={draw.card.id} className="text-sm leading-relaxed">
              <strong>
                {locale === "en" ? draw.card.nameEn : draw.card.name}
              </strong>{" "}
              — {draw.isReversed ? draw.card.reversed : draw.card.upright}
            </p>
          ))}
        {mode === "daily" && (
          <div aria-live="polite">
            {interpretation.isPending && <p>{t("tarot.generating")}</p>}
            {interpretation.isError && (
              <div role="alert">
                <p className="text-destructive">
                  {interpretation.error.message}
                </p>
                <Button
                  variant="outline"
                  onClick={() => interpretation.mutate(drawn[0])}
                >
                  {t("common.retry")}
                </Button>
              </div>
            )}
            {interpretation.data && (
              <Markdown>{interpretation.data.answer || ""}</Markdown>
            )}
          </div>
        )}
        {mode === "spread" && allRevealed && (
          <Button onClick={() => confirm(drawn)}>
            {t("tools.add_to_chat")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
