<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();
function goToChat() {
  void router.push("/");
}
</script>

<template>
  <div class="bg-base-100 flex flex-col items-center justify-center py-15">
    <p class="mb-2 text-4xl font-bold">404</p>
    <h1 class="text-xl font-bold">{{ t("not_found.title") }}</h1>
    <br />
    <p class="text-base-content/60 mb-6 w-1/3 text-center">
      {{ t("not_found.desc") }}
    </p>
    <button class="btn" @click="goToChat">{{ t("not_found.back") }}</button>
  </div>
</template>
