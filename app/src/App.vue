<script setup lang="ts">
import { ref } from "vue";
import TopBar from "./components/TopBar.vue";
import SideBar from "./components/SideBar.vue";
import FortuneModal from "./components/FortuneModal.vue";
import ToolsModal from "./components/ToolsModal.vue";
import type { DrawnCard } from "./types";

const sidebarOpen = ref(false);
const showFortuneModal = ref(false);
const showToolsModal = ref(false);

const selectedToolCards = ref<DrawnCard[]>([]);

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar() {
  sidebarOpen.value = false;
}

function handleToolConfirm(cards: DrawnCard[]) {
  selectedToolCards.value = cards;
  showToolsModal.value = false;
}
</script>

<template>
  <div class="min-w-80 h-screen flex flex-col bg-base-100">
    <!-- 顶部栏 -->
    <TopBar
      :sidebar-open="sidebarOpen"
      @toggle-sidebar="toggleSidebar"
      @open-fortune="showFortuneModal = true"
      @open-tools="showToolsModal = true"
    />

    <div class="flex-1 flex overflow-hidden relative">
      <!-- 侧边栏遮罩 -->
      <Transition name="fade">
        <div
          v-if="sidebarOpen"
          class="fixed inset-0 bg-black/50 z-20 lg:hidden"
          @click="closeSidebar"
        ></div>
      </Transition>

      <!-- 侧边栏 -->
      <Transition name="slide">
        <aside v-if="sidebarOpen" class="fixed lg:relative z-30 w-72 h-full">
          <SideBar @close="closeSidebar" />
        </aside>
      </Transition>

      <!-- 主内容 -->
      <main class="flex-1 overflow-hidden">
        <router-view v-slot="{ Component }">
          <component
            :is="Component"
            :selected-tool-cards="selectedToolCards"
            @open-fortune="showFortuneModal = true"
            @open-tools="showToolsModal = true"
            @clear-tool-cards="selectedToolCards = []"
          />
        </router-view>
      </main>
    </div>

    <FortuneModal v-if="showFortuneModal" @close="showFortuneModal = false" />

    <ToolsModal
      v-if="showToolsModal"
      @close="showToolsModal = false"
      @confirm="handleToolConfirm"
    />
  </div>
</template>
