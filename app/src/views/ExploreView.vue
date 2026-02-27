<script setup lang="ts">
import { ref, computed } from "vue";
import { useTarotStore } from "../stores/tarot";
import type { TarotCard } from "../types";

const tarotStore = useTarotStore();

const selectedCategory = ref<
  "all" | "major" | "wands" | "cups" | "swords" | "pentacles"
>("all");

const selectedCard = ref<TarotCard | null>(null);

const searchQuery = ref("");

const categories = [
  { key: "all", label: "全部", count: 78 },
  { key: "major", label: "大阿尔卡纳", count: 22 },
  { key: "wands", label: "权杖", count: 14 },
  { key: "cups", label: "圣杯", count: 14 },
  { key: "swords", label: "宝剑", count: 14 },
  { key: "pentacles", label: "钱币", count: 14 },
];

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
  <div class="h-full flex flex-col overflow-hidden">
    <!-- 页面标题和搜索 -->
    <div class="p-4 bg-base-100 border-b border-base-300">
      <div class="max-w-6xl mx-auto">
        <div
          class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <h1 class="text-2xl font-bold flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-7 w-7 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              塔罗图鉴
            </h1>
          </div>

          <!-- 搜索框 -->
          <div class="w-full sm:w-64">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索牌名或关键词..."
              class="input input-bordered w-full"
            />
          </div>
        </div>

        <!-- 分类标签 -->
        <div class="flex flex-wrap gap-2 mt-4">
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
      <div class="max-w-6xl mx-auto">
        <div
          v-if="filteredCards.length === 0"
          class="text-center py-12 text-base-content/60"
        >
          没有找到相关的塔罗牌
        </div>

        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          <div
            v-for="card in filteredCards"
            :key="card.id"
            class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
            @click="openDetail(card)"
          >
            <figure class="pt-4 px-4">
              <div
                class="w-full aspect-2/3 rounded-lg overflow-hidden bg-base-300"
              >
                <img
                  :src="getCardImage(card)"
                  :alt="card.nameEn"
                  class="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </figure>
            <div class="card-body p-3">
              <h3 class="card-title text-sm justify-center">
                <span :class="getSuitColor(card.suit)">{{ card.name }}</span>
              </h3>
              <p class="text-xs text-center text-base-content/60">
                {{ card.nameEn }}
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
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          @click="closeDetail"
        >
          ✕
        </button>

        <div class="flex flex-col md:flex-row gap-6">
          <!-- 牌面 -->
          <div class="shrink-0">
            <div
              class="w-40 h-64 mx-auto rounded-xl overflow-hidden shadow-lg bg-base-300"
            >
              <img
                :src="getCardImage(selectedCard)"
                :alt="selectedCard.nameEn"
                class="w-full h-full object-cover"
              />
            </div>
          </div>

          <div class="flex-1">
            <h3 class="text-xl font-bold flex items-center gap-2">
              <span :class="getSuitColor(selectedCard.suit)">
                {{ selectedCard.name }}</span
              >
            </h3>
            <p class="text-base-content/60 mb-4">{{ selectedCard.nameEn }}</p>

            <div class="mb-4">
              <h4 class="text-sm font-semibold mb-2">关键词</h4>
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
              <h4 class="text-sm font-semibold mb-2">牌义描述</h4>
              <p class="text-sm text-base-content/80">
                {{ selectedCard.description }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="bg-success/10 rounded-lg p-3">
                <h4
                  class="text-sm font-semibold text-success mb-1 flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  正位
                </h4>
                <p class="text-sm">{{ selectedCard.upright }}</p>
              </div>

              <div class="bg-error/10 rounded-lg p-3">
                <h4
                  class="text-sm font-semibold text-error mb-1 flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  逆位
                </h4>
                <p class="text-sm">{{ selectedCard.reversed }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="closeDetail">关闭</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeDetail"></div>
    </div>
  </div>
</template>
