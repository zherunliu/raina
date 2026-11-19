import { useState } from "react";
import { cards, cardImage } from "@/lib/tarot";
import type { TarotCard } from "@/types";
import { useI18n } from "@/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export function ExplorePage() {
  const { t, locale } = useI18n();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TarotCard | null>(null);
  const filtered = cards.filter(
    (card) =>
      (category === "all" ||
        (category === "major"
          ? card.type === "major"
          : card.suit === category)) &&
      [card.name, card.nameEn, ...card.keywords].some((v) =>
        v.toLowerCase().includes(search.toLowerCase()),
      ),
  );
  return (
    <div className="h-full overflow-auto p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">{t("explore.title")}</h1>
          <Input
            className="max-w-sm"
            aria-label={t("explore.search_placeholder")}
            placeholder={t("explore.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="my-6 flex flex-wrap gap-2">
          {["all", "major", "wands", "cups", "swords", "pentacles"].map(
            (cat) => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                aria-pressed={category === cat}
                onClick={() => setCategory(cat)}
              >
                {t(`explore.cat_${cat}`)}
              </Button>
            ),
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((card) => (
            <button
              key={card.id}
              className="text-left"
              onClick={() => setSelected(card)}
            >
              <img
                src={cardImage(card)}
                alt={card.nameEn}
                loading="lazy"
                className="aspect-[3/5] w-full rounded-lg object-cover shadow-sm"
              />
              <h2 className="mt-3 text-sm font-medium">
                {locale === "en" ? card.nameEn : card.name}
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                {locale === "en" ? card.name : card.nameEn}
              </p>
            </button>
          ))}
        </div>
        {!filtered.length && (
          <p className="text-muted-foreground py-16 text-center">
            {t("explore.empty")}
          </p>
        )}
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-auto sm:max-w-2xl">
          {selected && (
            <>
              <DialogTitle>
                {locale === "en" ? selected.nameEn : selected.name}
              </DialogTitle>
              <DialogDescription>
                {selected.keywords.join(" · ")}
              </DialogDescription>
              <div className="flex flex-col items-start gap-6 sm:flex-row">
                <img
                  src={cardImage(selected)}
                  alt={selected.nameEn}
                  className="mx-auto w-36 rounded-lg"
                />
                <div className="space-y-4 text-sm leading-relaxed">
                  <p>{selected.description}</p>
                  <section>
                    <h3 className="font-semibold">
                      {t("tarot.upright_plain")}
                    </h3>
                    <p>{selected.upright}</p>
                  </section>
                  <section>
                    <h3 className="font-semibold">
                      {t("tarot.reversed_plain")}
                    </h3>
                    <p>{selected.reversed}</p>
                  </section>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
