<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { useI18n } from "vue-i18n";
import type { ChatMessage } from "../types";
import ChatMessageItem from "./ChatMessage.vue";

const props = defineProps<{
  messages: ChatMessage[];
  loading?: boolean;
}>();

const { t } = useI18n();

const parentRef = ref<HTMLElement | null>(null);
const isAtBottom = ref(true);

const rowCount = computed(
  () => props.messages.length + (props.loading ? 1 : 0),
);

function getKey(index: number) {
  if (index < props.messages.length)
    return props.messages[index]?.id ?? `idx-${index}`;
  return "loading";
}

const virtualizer = useVirtualizer(
  computed(() => ({
    count: rowCount.value,
    getScrollElement: () => parentRef.value,
    estimateSize: () => 96,
    overscan: 10,
    getItemKey: getKey,
  })),
);

const virtualItems = computed(() => virtualizer.value.getVirtualItems());
const totalSize = computed(() => virtualizer.value.getTotalSize());

function updateIsAtBottom() {
  const el = parentRef.value;
  if (!el) return;
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
  isAtBottom.value = distance < 80;
}

async function scrollToBottom() {
  await nextTick();
  const lastIndex = rowCount.value - 1;
  if (lastIndex < 0) return;
  virtualizer.value.scrollToIndex(lastIndex, { align: "end" });
}

watch(
  () => props.messages.length,
  async () => {
    if (isAtBottom.value) {
      await scrollToBottom();
    }
  },
);

watch(
  () => props.messages[props.messages.length - 1]?.content,
  async () => {
    if (isAtBottom.value) {
      await scrollToBottom();
    }
  },
);

onMounted(() => {
  const el = parentRef.value;
  if (el) {
    el.addEventListener("scroll", updateIsAtBottom, { passive: true });
  }
  updateIsAtBottom();
});

onUnmounted(() => {
  parentRef.value?.removeEventListener("scroll", updateIsAtBottom);
});
</script>

<template>
  <div ref="parentRef" class="h-full overflow-y-auto p-4">
    <div
      class="relative mx-auto max-w-3xl"
      :style="{ height: `${totalSize}px` }"
    >
      <div
        v-for="item in virtualItems"
        :key="String(item.key)"
        class="absolute top-0 left-0 w-full"
        :style="{ transform: `translateY(${item.start}px)` }"
      >
        <div :ref="(el) => el && virtualizer.measureElement(el as Element)">
          <ChatMessageItem
            v-if="item.index < messages.length"
            :message="messages[item.index]!"
          />
          <div v-else class="text-base-content/60 flex items-center gap-2 py-2">
            <span class="loading loading-dots loading-sm"></span>
            <span class="text-sm">{{ t("chat.thinking") }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
