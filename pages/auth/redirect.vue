<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  // Handle the redirect from Microsoft authentication
  if (process.client) {
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-neutral-100">
    <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
    <p class="mt-4 text-lg text-neutral-700">Completing authentication...</p>
  </div>
</template>