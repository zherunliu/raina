<script setup lang="ts">
import { ref, computed } from "vue";
import { ArrowDown, ArrowUp, BookOpen } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { useTarotStore } from "../stores/tarot";
import type { TarotCard } from "../types";

const tarotStore = useTarotStore();
const { t, locale } = useI18n();

const selectedCategory = ref<
  "all" | "major" | "wands" | "cups" | "swords" | "pentacles"
>("all");

const selectedCard = ref<TarotCard | null>(null);

const searchQuery = ref("");

const categories = computed(() => [
  { key: "all", label: t("explore.cat_all"), count: 78 },
  { key: "major", label: t("explore.cat_major"), count: 22 },
  { key: "wands", label: t("explore.cat_wands"), count: 14 },
  { key: "cups", label: t("explore.cat_cups"), count: 14 },
  { key: "swords", label: t("explore.cat_swords"), count: 14 },
  { key: "pentacles", label: t("explore.cat_pentacles"), count: 14 },
]);

const filteredCards = computed(() => {
  let cards: TarotCard[] = [];

  if (selectedCategory.value === "all") {
    cards = tarotStore.cards;
  } else {
    cards = tarotStore.cardsBySuit[selectedCategory.value] || [];
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    cards = cards.filter(
      (card) =>
        card.name.toLowerCase().includes(query) ||
        card.nameEn.toLowerCase().includes(query) ||
        card.keywords.some((k) => k.toLowerCase().includes(query)),
    );
  }

  return cards;
});

function getSuitColor(suit?: string): string {
  switch (suit) {
    case "wands":
      return "text-amber-400";
    case "cups":
      return "text-blue-400";
    case "swords":
      return "text-slate-400";
    case "pentacles":
      return "text-lime-400";
    default:
      return "text-violet-400";
  }
}

function getCardImage(card: TarotCard): string {
  return `/src/assets/tarot_images/${card.image}`;
}

function openDetail(card: TarotCard) {
  selectedCard.value = card;
}

function closeDetail() {
  selectedCard.value = null;
}
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- 页面标题和搜索 -->
    <div class="bg-base-100 border-base-300 border-b p-4">
      <div class="mx-auto max-w-6xl">
        <div
          class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <h1 class="flex items-center gap-2 text-2xl font-bold">
              <BookOpen class="text-accent h-7 w-7" />
              {{ t("explore.title") }}
            </h1>
          </div>

          <!-- 搜索框 -->
          <div class="w-full sm:w-64">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('explore.search_placeholder')"
              class="input input-bordered w-full"
            />
          </div>
        </div>

        <!-- 分类标签 -->
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="cat in categories"
            :key="cat.key"
            class="btn btn-sm"
            :class="selectedCategory === cat.key ? 'btn-primary' : 'btn-ghost'"
            @click="selectedCategory = cat.key as typeof selectedCategory"
          >
            {{ cat.label }}
            <span class="badge badge-sm">{{ cat.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 卡片网格 -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="mx-auto max-w-6xl">
        <div
          v-if="filteredCards.length === 0"
          class="text-base-content/60 py-12 text-center"
        >
          {{ t("explore.empty") }}
        </div>

        <div
          class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          <div
            v-for="card in filteredCards"
            :key="card.id"
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
            @click="openDetail(card)"
          >
            <figure class="px-4 pt-4">
              <div
                class="bg-base-300 aspect-2/3 w-full overflow-hidden rounded-lg"
              >
                <img
                  :src="getCardImage(card)"
                  :alt="card.nameEn"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </figure>
            <div class="card-body p-3">
              <h3 class="card-title justify-center text-sm">
                <span :class="getSuitColor(card.suit)">{{
                  locale.startsWith("en") ? card.nameEn : card.name
                }}</span>
              </h3>
              <p class="text-base-content/60 text-center text-xs">
                {{ locale.startsWith("en") ? card.name : card.nameEn }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹框 -->
    <div v-if="selectedCard" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <button
          class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
          @click="closeDetail"
        >
          ✕
        </button>

        <div class="flex flex-col gap-6 md:flex-row">
          <!-- 牌面 -->
          <div class="shrink-0">
            <div
              class="bg-base-300 mx-auto h-64 w-40 overflow-hidden rounded-xl shadow-lg"
            >
              <img
                :src="getCardImage(selectedCard)"
                :alt="selectedCard.nameEn"
                class="h-full w-full object-cover"
              />
            </div>
          </div>

          <div class="flex-1">
            <h3 class="flex items-center gap-2 text-xl font-bold">
              <span :class="getSuitColor(selectedCard.suit)">
                {{
                  locale.startsWith("en")
                    ? selectedCard.nameEn
                    : selectedCard.name
                }}</span
              >
            </h3>
            <p class="text-base-content/60 mb-4">
              {{
                locale.startsWith("en")
                  ? selectedCard.name
                  : selectedCard.nameEn
              }}
            </p>

            <div class="mb-4">
              <h4 class="mb-2 text-sm font-semibold">
                {{ t("explore.keywords_title") }}
              </h4>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="keyword in selectedCard.keywords"
                  :key="keyword"
                  class="badge badge-outline"
                >
                  {{ keyword }}
                </span>
              </div>
            </div>

            <div class="mb-4">
              <h4 class="mb-2 text-sm font-semibold">
                {{ t("explore.meaning_desc_title") }}
              </h4>
              <p class="text-base-content/80 text-sm">
                {{ selectedCard.description }}
              </p>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="bg-success/10 rounded-lg p-3">
                <h4
                  class="text-success mb-1 flex items-center gap-1 text-sm font-semibold"
                >
                  <ArrowUp class="h-4 w-4" />
                  {{ t("tarot.upright_plain") }}
                </h4>
                <p class="text-sm">{{ selectedCard.upright }}</p>
              </div>

              <div class="bg-error/10 rounded-lg p-3">
                <h4
                  class="text-error mb-1 flex items-center gap-1 text-sm font-semibold"
                >
                  <ArrowDown class="h-4 w-4" />
                  {{ t("tarot.reversed_plain") }}
                </h4>
                <p class="text-sm">{{ selectedCard.reversed }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="closeDetail">
            {{ t("common.close") }}
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeDetail"></div>
    </div>
  </div>
</template>
