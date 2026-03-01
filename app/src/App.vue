<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import TopBar from "./components/TopBar.vue";
import SideBar from "./components/SideBar.vue";
import FortuneModal from "./components/FortuneModal.vue";
import ToolsModal from "./components/ToolsModal.vue";
import { useUiStore } from "./stores/ui";

const uiStore = useUiStore();

const sidebarOpen = ref(false);

/* 监听屏幕尺寸自动收起侧边栏 */
const isLargeScreen = ref(false);
const mediaQuery = window.matchMedia("(min-width: 1024px)");
const updateScreenStatus = (e: MediaQueryListEvent | MediaQueryList) => {
  isLargeScreen.value = e.matches;
  if (!isLargeScreen.value && sidebarOpen.value) {
    closeSidebar();
  }
};

onMounted(() => {
  updateScreenStatus(mediaQuery);
  mediaQuery.addEventListener("change", updateScreenStatus);
});

onUnmounted(() => {
  mediaQuery.removeEventListener("change", updateScreenStatus);
});

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar() {
  sidebarOpen.value = false;
}
</script>

<template>
  <div class="min-w-80 h-screen flex flex-col bg-base-100">
    <!-- 顶部栏 -->
    <TopBar :sidebar-open="sidebarOpen" @toggle-sidebar="toggleSidebar" />

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
        <router-view />
      </main>
    </div>

    <FortuneModal
      v-if="uiStore.showFortuneModal"
      @close="uiStore.closeFortuneModal"
    />

    <ToolsModal
      v-if="uiStore.showToolsModal"
      @close="uiStore.closeToolsModal"
      @confirm="uiStore.confirmToolCards"
    />
  </div>
</template>
