<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTarotStore } from "../stores/tarot";
import type { DrawnCard } from "../types";
import { chatApi } from "../api";

const tarotStore = useTarotStore();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const drawnCard = ref<DrawnCard | null>(null);
const isRevealed = ref(false);
const showInterpretation = ref(false);
const interpretation = ref("");
const loadingInterpretation = ref(false);

function drawCard() {
  const cards = tarotStore.drawCards(1);
  drawnCard.value = cards[0] ?? null;
  isRevealed.value = false;
  showInterpretation.value = false;
  interpretation.value = "";
}

function revealCard() {
  isRevealed.value = true;

  setTimeout(() => {
    showInterpretation.value = true;
    generateInterpretation();
  }, 800);
}

async function generateInterpretation() {
  if (!drawnCard.value) return;

  loadingInterpretation.value = true;

  const card = drawnCard.value.card;
  const cardInfo = `【${card.name}】${drawnCard.value.isReversed ? "(逆位)" : "(正位)"}`;
  const preText = `${cardInfo}\n\n关键词：${drawnCard.value.isReversed ? card.reversed : card.upright}`;

  const baseText = await chatApi(cardInfo);

  const fullText = preText + "\n\n" + baseText;

  interpretation.value = "";
  for (const char of fullText) {
    interpretation.value += char;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  loadingInterpretation.value = false;
}

onMounted(() => {
  drawCard();
});

const cardImageUrl = computed(() => {
  if (!drawnCard.value) return "";
  return `/src/assets/tarot_images/${drawnCard.value.card.image}`;
});
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        @click="emit('close')"
      >
        ✕
      </button>

      <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 text-warning"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        今日运势
      </h3>

      <div class="flex flex-col md:flex-row gap-6">
        <!-- 牌面展示区 -->
        <div class="flex flex-col items-center">
          <!-- 卡片容器 -->
          <div
            class="card-flip w-40 h-64 cursor-pointer mb-4"
            @click="!isRevealed && revealCard()"
          >
            <div
              class="card-inner relative w-full h-full"
              :class="{ flipped: isRevealed }"
            >
              <!-- 卡背 -->
              <div
                class="card-front absolute inset-0 rounded-xl bg-linear-to-br from-indigo-900 to-purple-900 border-2 flex items-center justify-center shadow-lg"
              >
                <img
                  src="../assets/hexagram.png"
                  alt="hexagram"
                  class="w-[60%]"
                />
              </div>

              <!-- 卡面 -->
              <div
                class="card-back absolute inset-0 rounded-xl bg-base-200 border-2 overflow-hidden shadow-lg"
                :class="{ 'rotate-180': drawnCard?.isReversed }"
              >
                <img
                  v-if="drawnCard"
                  :src="cardImageUrl"
                  :alt="drawnCard.card.name"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <!-- 牌名显示 -->
          <div v-if="isRevealed && drawnCard" class="text-center">
            <p class="font-bold text-lg">{{ drawnCard.card.name }}</p>
            <p class="text-sm text-base-content/60">
              {{ drawnCard.card.nameEn }}
              <span
                :class="drawnCard.isReversed ? 'text-error' : 'text-success'"
              >
                ({{ drawnCard.isReversed ? "逆位" : "正位" }})
              </span>
            </p>
          </div>
        </div>

        <!-- 解读区域 -->
        <div class="flex-1 min-h-200px">
          <div
            v-if="!isRevealed"
            class="h-full flex items-center justify-center text-base-content/40"
          >
            <p>点击卡牌翻开查看今日运势</p>
          </div>

          <div v-else-if="showInterpretation" class="h-full">
            <h4 class="font-semibold mb-2 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI 解读
            </h4>

            <div class="bg-base-200 rounded-lg p-4 min-h-150px">
              <p class="whitespace-pre-wrap text-sm leading-relaxed">
                {{ interpretation }}
              </p>
              <span
                v-if="loadingInterpretation"
                class="loading loading-dots loading-xs"
              ></span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn" @click="emit('close')">关闭</button>
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
  transition: transform 0.6s;
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
