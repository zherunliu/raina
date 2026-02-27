<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
function goToChat() {
  router.push("/");
}
</script>

<template>
  <div
    class="min-w-60 flex flex-col items-center justify-center bg-base-100 py-15"
    data-theme="winter"
  >
    <p class="text-4xl font-bold mb-2">404</p>
    <h1 class="font-bold text-xl">PAGE NOT FOUND</h1>
    <br />
    <p class="w-1/3 mb-6 text-base-content/60 text-center">
      But if you don't change your direction, and if you keep looking, you may
      end up where you are heading.
    </p>
    <button class="btn" @click="goToChat">take me home</button>
  </div>
</template>
