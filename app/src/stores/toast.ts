import { defineStore } from "pinia";
import { ref } from "vue";

export type ToastType = "success" | "error";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const TOAST_DURATION_MS = 2600;

export const useToastStore = defineStore("toast", () => {
  const toasts = ref<ToastItem[]>([]);

  function removeToast(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function pushToast(message: string, type: ToastType) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    toasts.value.push({ id, message, type });
    window.setTimeout(() => {
      removeToast(id);
    }, TOAST_DURATION_MS);
  }

  function success(message: string) {
    pushToast(message, "success");
  }

  function error(message: string) {
    pushToast(message, "error");
  }

  return {
    toasts,
    removeToast,
    success,
    error,
  };
});
