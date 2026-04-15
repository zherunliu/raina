<script setup lang="ts">
import { CheckCircle2, CircleAlert, X } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { useToastStore } from "../stores/toast";

const toastStore = useToastStore();
const { toasts } = storeToRefs(toastStore);
</script>

<template>
  <div
    class="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-4"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="alert pointer-events-auto border shadow-lg"
        :class="toast.type === 'success' ? 'alert-success' : 'alert-error'"
      >
        <CheckCircle2
          v-if="toast.type === 'success'"
          class="h-5 w-5 shrink-0"
        />
        <CircleAlert v-else class="h-5 w-5 shrink-0" />
        <span class="flex-1 text-sm">{{ toast.message }}</span>
        <button
          class="btn btn-ghost btn-xs btn-square"
          type="button"
          @click="toastStore.removeToast(toast.id)"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
