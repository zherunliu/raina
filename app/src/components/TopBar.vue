<script setup lang="ts">
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useDark, useToggle } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import {
  Blocks,
  Menu,
  MoonStar,
  Search,
  Sparkles,
  SunMedium,
} from "lucide-vue-next";
import { useUiStore } from "../stores/ui";
import { useAuthStore } from "../stores/auth";
import { useToastStore } from "../stores/toast";
import { setSavedLanguage, type Locale } from "../i18n";

const isDark = useDark({
  attribute: "data-theme",
  valueDark: "dim",
  valueLight: "winter",
  storageKey: "theme",
  storage: localStorage,
});

const toggleDark = useToggle(isDark);
const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();
const authStore = useAuthStore();
const toastStore = useToastStore();
const { t, locale } = useI18n();
const showLogoutConfirm = ref(false);

defineProps<{
  sidebarOpen: boolean;
}>();

const emit = defineEmits<(e: "toggle-sidebar") => void>();

function goToExplore() {
  void router.push("/explore");
}

function goToChat() {
  void router.push("/");
}

function openLogoutConfirm() {
  showLogoutConfirm.value = true;
}

function closeLogoutConfirm() {
  showLogoutConfirm.value = false;
}

async function confirmLogout() {
  closeLogoutConfirm();
  authStore.logout();
  toastStore.success(t("auth.logout_success"));
  await router.replace("/login");
}

function setLang(lang: Locale) {
  locale.value = lang;
  setSavedLanguage(lang);
}
</script>

<template>
  <header
    class="bg-base-100 border-base-300 grid h-14 grid-cols-3 border-b px-4"
  >
    <div class="flex items-center gap-2 justify-self-start">
      <!-- 侧边栏切换按钮 -->
      <button
        v-if="route.path === '/'"
        class="btn btn-ghost btn-sm btn-square"
        @click="emit('toggle-sidebar')"
      >
        <Menu class="h-5 w-5" />
      </button>

      <!-- Logo -->
      <div class="cursor-pointer font-bold" @click="goToChat">Raina</div>
    </div>

    <!-- 中间导航按钮 -->
    <div class="flex items-center gap-2 justify-self-center">
      <button
        class="btn btn-ghost btn-sm gap-1"
        @click="uiStore.openFortuneModal()"
      >
        <Sparkles class="h-4 w-4" />
        <span class="hidden sm:inline">{{ t("nav.daily") }}</span>
      </button>

      <button
        v-if="route.path === '/'"
        class="btn btn-ghost btn-sm gap-1"
        @click="uiStore.openToolsModal()"
      >
        <Blocks class="h-4 w-4" />
        <span class="hidden sm:inline">{{ t("nav.spreads") }}</span>
      </button>

      <button
        class="btn btn-sm gap-1"
        :class="route.path === '/explore' ? 'btn-primary' : 'btn-ghost'"
        @click="goToExplore"
      >
        <Search class="h-4 w-4" />
        <span class="hidden sm:inline">{{ t("nav.explore") }}</span>
      </button>
    </div>

    <!-- 主题切换按钮 -->
    <div class="flex items-center justify-self-end">
      <div class="dropdown dropdown-end mr-2">
        <button class="btn btn-ghost btn-sm" tabindex="0">
          {{ t(`language.${locale}`) }}
        </button>
        <ul
          tabindex="0"
          class="dropdown-content menu bg-base-100 rounded-box border-base-300 z-10 w-40 border p-2 shadow"
        >
          <li>
            <button @click="setLang('zh')">{{ t("language.zh") }}</button>
          </li>
          <li>
            <button @click="setLang('en')">{{ t("language.en") }}</button>
          </li>
        </ul>
      </div>

      <button class="btn btn-ghost btn-sm mr-2" @click="openLogoutConfirm">
        {{ t("auth.logout") }}
      </button>
      <label class="swap swap-rotate">
        <input
          type="checkbox"
          class="theme-controller"
          :checked="isDark"
          @change="toggleDark()"
        />
        <SunMedium class="swap-off h-5 w-5" />
        <MoonStar class="swap-on h-5 w-5" />
      </label>
    </div>
  </header>

  <div v-if="showLogoutConfirm" class="modal modal-open">
    <div class="modal-box max-w-md">
      <h3 class="text-lg font-semibold">
        {{ t("auth.logout_confirm_title") }}
      </h3>
      <p class="text-base-content/70 mt-2 text-sm">
        {{ t("auth.logout_confirm_desc") }}
      </p>

      <div class="modal-action">
        <button class="btn" type="button" @click="closeLogoutConfirm">
          {{ t("common.cancel") }}
        </button>
        <button class="btn btn-error" type="button" @click="confirmLogout">
          {{ t("common.confirm") }}
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="closeLogoutConfirm"></div>
  </div>
</template>
