<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

defineProps<{
  sidebarOpen: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle-sidebar"): void;
  (e: "open-fortune"): void;
  (e: "open-tools"): void;
}>();

function goToExplore() {
  router.push("/explore");
}

function goToChat() {
  router.push("/");
}
</script>

<template>
  <header
    class="h-14 bg-base-100 border-b border-base-300 flex items-center justify-between px-4"
  >
    <div class="flex items-center gap-2">
      <!-- 侧边栏切换按钮 -->
      <button
        class="btn btn-ghost btn-sm btn-square"
        @click="emit('toggle-sidebar')"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <!-- Logo -->
      <button class="btn btn-ghost gap-2" @click="goToChat">Raina</button>
    </div>

    <!-- 中间导航按钮 -->
    <div class="flex items-center gap-2">
      <button class="btn btn-ghost btn-sm gap-1" @click="emit('open-fortune')">
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
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <span class="hidden sm:inline">今日运势</span>
      </button>

      <button
        v-if="route.path === '/'"
        class="btn btn-ghost btn-sm gap-1"
        @click="emit('open-tools')"
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <span class="hidden sm:inline">选择牌阵</span>
      </button>

      <button
        class="btn btn-sm gap-1"
        :class="route.path === '/explore' ? 'btn-primary' : 'btn-ghost'"
        @click="goToExplore"
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span class="hidden sm:inline">探索牌义</span>
      </button>
    </div>

    <!-- 右侧空白区域保持平衡 -->
    <div class="w-20"></div>
  </header>
</template>
