<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../stores/auth";
import { registerApi } from "../api";
import { useToastStore } from "../stores/toast";

const router = useRouter();
const authStore = useAuthStore();
const toastStore = useToastStore();
const { t } = useI18n();

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const errorMsg = ref<string | null>(null);

async function onSubmit() {
  if (!email.value || !password.value || loading.value) return;
  if (password.value !== confirmPassword.value) {
    errorMsg.value = t("auth.password_mismatch");
    toastStore.error(errorMsg.value);
    return;
  }
  loading.value = true;
  errorMsg.value = null;
  try {
    const res = await registerApi(email.value, password.value);
    if (
      res.code === 1000 &&
      typeof res.token === "string" &&
      res.token.length > 0
    ) {
      toastStore.success(t("auth.register_success"));
      authStore.setToken(res.token);
      await router.replace("/");
      return;
    }
    errorMsg.value = res.message ?? t("auth.register_failed");
    toastStore.error(errorMsg.value);
  } catch (err) {
    errorMsg.value =
      err instanceof Error ? err.message : t("auth.register_failed");
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
        <h2 class="text-2xl font-semibold">{{ t("auth.register") }}</h2>
        <p class="text-base-content/60 text-sm">
          {{ t("auth.register_desc") }}
        </p>

        <form class="mt-4 space-y-3" @submit.prevent="onSubmit">
          <div>
            <label class="label">
              <span class="label-text">{{ t("auth.email") }}</span>
            </label>
            <input
              v-model="email"
              type="email"
              class="input input-bordered w-full"
              autocomplete="email"
              :placeholder="t('auth.email_placeholder')"
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
              autocomplete="new-password"
              :placeholder="t('auth.password_placeholder')"
            />
          </div>

          <div>
            <label class="label">
              <span class="label-text">{{ t("auth.confirm_password") }}</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              class="input input-bordered w-full"
              autocomplete="new-password"
              :placeholder="t('auth.confirm_password_placeholder')"
            />
          </div>

          <div v-if="errorMsg" class="text-error text-sm">
            {{ errorMsg }}
          </div>

          <button class="btn btn-primary w-full" :disabled="loading">
            {{ loading ? t("auth.signing_up") : t("auth.register") }}
          </button>
        </form>

        <div class="mt-2 text-sm">
          {{ t("auth.has_account") }}
          <router-link class="link link-primary" to="/login">
            {{ t("auth.go_login") }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
