<script setup lang="ts">
import { ref, computed } from "vue";
import { Blocks, WandSparkles } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { useTarotStore } from "../stores/tarot";
import type { DrawnCard } from "../types";

const tarotStore = useTarotStore();
const { t, locale } = useI18n();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "confirm", cards: DrawnCard[]): void;
}>();

const drawCount = ref(3);
const drawnCards = ref<DrawnCard[]>([]);
const hasDrawn = ref(false);
const revealedIndices = ref<Set<number>>(new Set());

const cardsOptions = [
  "tools.spreads.single",
  "tools.spreads.timeline",
  "tools.spreads.relationship",
  "tools.spreads.cross",
];
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
    <div class="modal-box max-h-[90vh] max-w-4xl">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
        @click="emit('close')"
      >
        ✕
      </button>

      <h3 class="mb-4 flex items-center gap-2 text-lg font-bold">
        <Blocks class="text-secondary h-6 w-6" />
        {{ t("tools.title") }}
      </h3>

      <div v-if="!hasDrawn" class="py-8 text-center">
        <p class="text-base-content/60 mb-6">
          {{ t("tools.desc") }}
        </p>

        <div class="mb-8 flex justify-center gap-2">
          <button
            v-for="(count, index) in countOptions"
            :key="index"
            class="btn"
            :class="drawCount === count ? 'btn-primary' : 'btn-outline'"
            @click="drawCount = count"
          >
            {{ t(cardsOptions[index]!) }}
          </button>
        </div>

        <button class="btn btn-primary btn-lg gap-2" @click="draw">
          <WandSparkles class="h-6 w-6" />
          {{ t("tools.start_draw") }}
        </button>
      </div>

      <div v-else>
        <div class="mb-4 flex items-center justify-between">
          <p class="text-base-content/60 text-sm">
            {{ t("tools.tap_to_reveal") }}
            <button class="link link-primary" @click="revealAll">
              {{ t("tools.reveal_all") }}
            </button>
          </p>
          <button class="btn btn-ghost btn-sm" @click="reset">
            {{ t("tools.reselect") }}
          </button>
        </div>

        <!-- 牌面展示 -->
        <div class="mb-6 flex flex-wrap justify-center gap-4">
          <div
            v-for="(drawnCard, index) in drawnCards"
            :key="index"
            class="cursor-pointer"
            @click="revealCard(index)"
          >
            <!-- 卡片容器 -->
            <div class="card-flip h-36 w-24 sm:h-44 sm:w-28">
              <div
                class="card-inner relative h-full w-full"
                :class="{ flipped: revealedIndices.has(index) }"
              >
                <!-- 卡背 -->
                <div
                  class="card-front absolute inset-0 flex items-center justify-center rounded-lg border-2 bg-linear-to-br from-indigo-900 to-purple-900 shadow-md"
                >
                  <img
                    src="../assets/hexagram.png"
                    alt="hexagram"
                    class="w-[60%]"
                  />
                </div>

                <!-- 卡面 -->
                <div
                  class="card-back bg-base-200 absolute inset-0 overflow-hidden rounded-lg border-2 shadow-md"
                  :class="{ 'rotate-180': drawnCard.isReversed }"
                >
                  <img
                    :src="getCardImage(drawnCard)"
                    :alt="drawnCard.card.nameEn"
                    class="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <!-- 牌名 -->
            <div v-if="revealedIndices.has(index)" class="mt-2 text-center">
              <p class="w-24 truncate text-xs font-medium sm:w-28">
                {{
                  locale.startsWith("en")
                    ? drawnCard.card.nameEn
                    : drawnCard.card.name
                }}
              </p>
              <p
                class="text-xs"
                :class="drawnCard.isReversed ? 'text-error' : 'text-success'"
              >
                {{
                  drawnCard.isReversed
                    ? t("tarot.reversed_plain")
                    : t("tarot.upright_plain")
                }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-if="revealedIndices.size > 0"
          class="bg-base-200 mb-4 max-h-48 overflow-y-auto rounded-lg p-4"
        >
          <h4 class="mb-2 font-semibold">
            {{ t("tools.spread_interpretation") }}
          </h4>
          <div class="space-y-2">
            <div
              v-for="(drawnCard, index) in drawnCards.filter((_, i) =>
                revealedIndices.has(i),
              )"
              :key="index"
              class="text-sm"
            >
              <span class="font-medium">{{
                locale.startsWith("en")
                  ? drawnCard.card.nameEn
                  : drawnCard.card.name
              }}</span>
              <span
                :class="drawnCard.isReversed ? 'text-error' : 'text-success'"
              >
                {{
                  drawnCard.isReversed
                    ? t("tarot.reversed")
                    : t("tarot.upright")
                }}
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
        <button class="btn" @click="emit('close')">
          {{ t("common.cancel") }}
        </button>
        <button
          v-if="hasDrawn"
          class="btn btn-primary"
          :disabled="!allRevealed"
          @click="confirmSelection"
        >
          {{ t("tools.add_to_chat") }}
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
