<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import TopBar from "./components/TopBar.vue";
import SideBar from "./components/SideBar.vue";
import FortuneModal from "./components/FortuneModal.vue";
import ToolsModal from "./components/ToolsModal.vue";
import ToastContainer from "./components/ToastContainer.vue";
import { useUiStore } from "./stores/ui";

const uiStore = useUiStore();
const route = useRoute();

const sidebarOpen = ref(false);

const isAuthPage = computed(
  () => route.path === "/login" || route.path === "/register",
);

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
  <ToastContainer />
  <router-view v-if="isAuthPage" />
  <div v-else class="bg-base-100 flex h-screen min-w-80 flex-col">
    <!-- 顶部栏 -->
    <TopBar :sidebar-open="sidebarOpen" @toggle-sidebar="toggleSidebar" />

    <div class="relative flex flex-1 overflow-hidden">
      <!-- 侧边栏遮罩 -->
      <Transition name="fade">
        <div
          v-if="sidebarOpen"
          class="fixed inset-0 z-20 bg-black/50 lg:hidden"
          @click="closeSidebar"
        ></div>
      </Transition>

      <!-- 侧边栏 -->
      <Transition name="slide">
        <aside v-if="sidebarOpen" class="fixed z-30 h-full w-72 lg:relative">
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
