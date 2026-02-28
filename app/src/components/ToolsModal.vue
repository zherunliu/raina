<script setup lang="ts">
import { ref, computed } from "vue";
import { useTarotStore } from "../stores/tarot";
import type { DrawnCard } from "../types";

const tarotStore = useTarotStore();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", cards: DrawnCard[]): void;
}>();

const drawCount = ref(3);
const drawnCards = ref<DrawnCard[]>([]);
const hasDrawn = ref(false);
const revealedIndices = ref<Set<number>>(new Set());

const cardsOptions = ["单张解读", "时间流牌阵", "人际关系牌阵", "十字牌阵"];
const countOptions = [1, 3, 4, 5];

function draw() {
  drawnCards.value = tarotStore.drawCards(drawCount.value);
  hasDrawn.value = true;
  revealedIndices.value.clear();
}

function revealCard(index: number) {
  revealedIndices.value.add(index);
}

function revealAll() {
  for (let i = 0; i < drawnCards.value.length; i++) {
    revealedIndices.value.add(i);
  }
}

const allRevealed = computed(
  () =>
    drawnCards.value.length > 0 &&
    revealedIndices.value.size === drawnCards.value.length,
);

function confirmSelection() {
  emit("confirm", drawnCards.value);
  emit("close");
}

function reset() {
  hasDrawn.value = false;
  drawnCards.value = [];
  revealedIndices.value.clear();
}

function getCardImage(card: DrawnCard): string {
  return `/src/assets/tarot_images/${card.card.image}`;
}
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-4xl max-h-[90vh]">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        @click="emit('close')"
      >
        ✕
      </button>

      <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-secondary"
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
        选择牌阵 - 抽取塔罗牌
      </h3>

      <div v-if="!hasDrawn" class="text-center py-8">
        <p class="text-base-content/60 mb-6">
          选择牌阵，抽取后可以将结果加入对话中与 AI 讨论
        </p>

        <div class="flex justify-center gap-2 mb-8">
          <button
            v-for="(count, index) in countOptions"
            :key="index"
            class="btn"
            :class="drawCount === count ? 'btn-primary' : 'btn-outline'"
            @click="drawCount = count"
          >
            {{ cardsOptions[index] }}
          </button>
        </div>

        <button class="btn btn-primary btn-lg gap-2" @click="draw">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
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
          开始抽牌
        </button>
      </div>

      <div v-else>
        <div class="flex justify-between items-center mb-4">
          <p class="text-sm text-base-content/60">
            点击卡牌翻开，或
            <button class="link link-primary" @click="revealAll">
              全部翻开
            </button>
          </p>
          <button class="btn btn-ghost btn-sm" @click="reset">重新选择</button>
        </div>

        <!-- 牌面展示 -->
        <div class="flex flex-wrap justify-center gap-4 mb-6">
          <div
            v-for="(drawnCard, index) in drawnCards"
            :key="index"
            class="cursor-pointer"
            @click="revealCard(index)"
          >
            <!-- 卡片容器 -->
            <div class="card-flip w-24 h-36 sm:w-28 sm:h-44">
              <div
                class="card-inner relative w-full h-full"
                :class="{ flipped: revealedIndices.has(index) }"
              >
                <!-- 卡背 -->
                <div
                  class="card-front absolute inset-0 rounded-lg bg-linear-to-br from-indigo-900 to-purple-900 border-2 flex items-center justify-center shadow-md"
                >
                  <img
                    src="../assets/hexagram.png"
                    alt="hexagram"
                    class="w-[60%]"
                  />
                </div>

                <!-- 卡面 -->
                <div
                  class="card-back absolute inset-0 rounded-lg bg-base-200 border-2 overflow-hidden shadow-md"
                  :class="{ 'rotate-180': drawnCard.isReversed }"
                >
                  <img
                    :src="getCardImage(drawnCard)"
                    :alt="drawnCard.card.nameEn"
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <!-- 牌名 -->
            <div v-if="revealedIndices.has(index)" class="text-center mt-2">
              <p class="text-xs font-medium truncate w-24 sm:w-28">
                {{ drawnCard.card.name }}
              </p>
              <p
                class="text-xs"
                :class="drawnCard.isReversed ? 'text-error' : 'text-success'"
              >
                {{ drawnCard.isReversed ? "逆位" : "正位" }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="revealedIndices.size > 0"
          class="bg-base-200 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto"
        >
          <h4 class="font-semibold mb-2">牌阵解读</h4>
          <div class="space-y-2">
            <div
              v-for="(drawnCard, index) in drawnCards.filter((_, i) =>
                revealedIndices.has(i),
              )"
              :key="index"
              class="text-sm"
            >
              <span class="font-medium">{{ drawnCard.card.name }}</span>
              <span
                :class="drawnCard.isReversed ? 'text-error' : 'text-success'"
              >
                ({{ drawnCard.isReversed ? "逆位" : "正位" }})
              </span>
              <span class="text-base-content/60">
                -
                {{
                  drawnCard.isReversed
                    ? drawnCard.card.reversed
                    : drawnCard.card.upright
                }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn" @click="emit('close')">取消</button>
        <button
          v-if="hasDrawn"
          class="btn btn-primary"
          :disabled="!allRevealed"
          @click="confirmSelection"
        >
          加入对话
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="emit('close')"></div>
  </div>
</template>

<style scoped lang="scss">
.card-flip {
  perspective: 1000px;
}

.card-inner {
  transition: transform 0.5s;
  transform-style: preserve-3d;
}

.card-inner.flipped {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
</style>
