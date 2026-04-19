<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { loginApi } from "../api";
import { useAuthStore } from "../stores/auth";
import { useToastStore } from "../stores/toast";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toastStore = useToastStore();
const { t } = useI18n();

const username = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref<string | null>(null);

async function onSubmit() {
  if (!username.value || !password.value || loading.value) return;
  loading.value = true;
  errorMsg.value = null;

  try {
    const res = await loginApi(username.value, password.value);
    if (
      res.code === 1000 &&
      typeof res.token === "string" &&
      res.token.length > 0
    ) {
      toastStore.success(t("auth.login_success"));
      authStore.setToken(res.token);
      // Redirect to the original page or home
      const redirect =
        typeof route.query.redirect === "string" ? route.query.redirect : "/";
      await router.replace(redirect);
      return;
    }
    errorMsg.value = res.message ?? t("auth.login_failed");
    toastStore.error(errorMsg.value);
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : t("auth.login_failed");
    toastStore.error(errorMsg.value);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="bg-base-100 flex min-h-screen items-center justify-center px-4">
    <div class="card bg-base-100 border-base-300 w-full max-w-md border">
      <div class="card-body">
        <h2 class="text-2xl font-semibold">{{ t("auth.login") }}</h2>
        <p class="text-base-content/60 text-sm">
          {{ t("auth.login_desc") }}
        </p>

        <form class="mt-4 space-y-3" @submit.prevent="onSubmit">
          <div>
            <label class="label">
              <span class="label-text">{{ t("auth.username") }}</span>
            </label>
            <input
              v-model="username"
              class="input input-bordered w-full"
              autocomplete="username"
              :placeholder="t('auth.username_placeholder')"
            />
          </div>

          <div>
            <label class="label">
              <span class="label-text">{{ t("auth.password") }}</span>
            </label>
            <input
              v-model="password"
              type="password"
              class="input input-bordered w-full"
              autocomplete="current-password"
              :placeholder="t('auth.password_placeholder')"
            />
          </div>

          <div v-if="errorMsg" class="text-error text-sm">
            {{ errorMsg }}
          </div>

          <button class="btn btn-primary w-full" :disabled="loading">
            {{ loading ? t("auth.signing_in") : t("auth.login") }}
          </button>
        </form>

        <div class="mt-2 text-sm">
          {{ t("auth.no_account") }}
          <router-link class="link link-primary" to="/register">
            {{ t("auth.go_register") }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
