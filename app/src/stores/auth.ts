import { defineStore } from "pinia";
import { computed, ref } from "vue";

const TOKEN_KEY = "token";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));

  const isAuthenticated = computed(() => Boolean(token.value));

  function setToken(newToken: string | null) {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  function logout() {
    setToken(null);
  }

  return {
    token,
    isAuthenticated,
    setToken,
    logout,
  };
});
