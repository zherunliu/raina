<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Lightbulb, Sparkles } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { useTarotStore } from "../stores/tarot";
import type { DrawnCard } from "../types";
import { tarotDailyApi } from "../api";

const tarotStore = useTarotStore();
const { t } = useI18n();

const emit = defineEmits<(e: "close") => void>();

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
    void generateInterpretation();
  }, 800);
}

async function generateInterpretation() {
  if (!drawnCard.value) return;

  loadingInterpretation.value = true;

  const card = drawnCard.value.card;
  const cardInfo = `${card.name}${drawnCard.value.isReversed ? t("tarot.reversed") : t("tarot.upright")}`;
  const preText = `${cardInfo}\n\n${t("tarot.keywords")}: ${
    drawnCard.value.isReversed ? card.reversed : card.upright
  }`;
  let baseText = "";

  try {
    const res = await tarotDailyApi(cardInfo);
    baseText = res.code === 1000 ? (res.answer ?? "") : (res.message ?? "");
  } catch {
    baseText = t("common.network_error");
  }

  const fullText = preText + "\n\n" + baseText;

  try {
    interpretation.value = "";
    for (const char of fullText) {
      interpretation.value += char;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  } finally {
    loadingInterpretation.value = false;
  }
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
        class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
        @click="emit('close')"
      >
        ✕
      </button>

      <h3 class="mb-4 flex items-center gap-2 text-lg font-bold">
        <Sparkles class="text-warning h-6 w-6" />
        {{ t("tarot.daily_title") }}
      </h3>

      <div class="flex flex-col gap-6 md:flex-row">
        <!-- 牌面展示区 -->
        <div class="flex flex-col items-center">
          <!-- 卡片容器 -->
          <div
            class="card-flip mb-4 h-64 w-40 cursor-pointer"
            @click="!isRevealed && revealCard()"
          >
            <div
              class="card-inner relative h-full w-full"
              :class="{ flipped: isRevealed }"
            >
              <!-- 卡背 -->
              <div
                class="card-front absolute inset-0 flex items-center justify-center rounded-xl border-2 bg-linear-to-br from-indigo-900 to-purple-900 shadow-lg"
              >
                <img
                  src="../assets/hexagram.png"
                  alt="hexagram"
                  class="w-[60%]"
                />
              </div>

              <!-- 卡面 -->
              <div
                class="card-back bg-base-200 absolute inset-0 overflow-hidden rounded-xl border-2 shadow-lg"
                :class="{ 'rotate-180': drawnCard?.isReversed }"
              >
                <img
                  v-if="drawnCard"
                  :src="cardImageUrl"
                  :alt="drawnCard.card.name"
                  class="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          <!-- 牌名显示 -->
          <div v-if="isRevealed && drawnCard" class="text-center">
            <p class="text-lg font-bold">{{ drawnCard.card.name }}</p>
            <p class="text-base-content/60 text-sm">
              {{ drawnCard.card.nameEn }}
              <span
                :class="drawnCard.isReversed ? 'text-error' : 'text-success'"
              >
                {{
                  drawnCard.isReversed
                    ? t("tarot.reversed")
                    : t("tarot.upright")
                }}
              </span>
            </p>
          </div>
        </div>

        <!-- 解读区域 -->
        <div class="min-h-200px flex-1">
          <div
            v-if="!isRevealed"
            class="text-base-content/40 flex h-full items-center justify-center"
          >
            <p>{{ t("tarot.flip_to_reveal") }}</p>
          </div>

          <div v-else-if="showInterpretation" class="h-full">
            <h4 class="mb-2 flex items-center gap-2 font-semibold">
              <Lightbulb class="text-primary h-5 w-5" />
              {{ t("tarot.ai_interpretation") }}
            </h4>

            <div class="bg-base-200 min-h-150px rounded-lg p-4">
              <p class="text-sm leading-relaxed whitespace-pre-wrap">
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
        <button class="btn" @click="emit('close')">
          {{ t("common.close") }}
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
