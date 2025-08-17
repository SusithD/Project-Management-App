<script setup>
import { ref, onMounted } from 'vue';

const isDemoMode = ref(false);
const isLoading = ref(true);

// Check if current user is a demo user
const authStore = useAuthStore();
const isDemoUser = computed(() => authStore.isDemoUser());

// Check demo mode status
const checkDemoMode = async () => {
  try {
    const response = await $fetch('/api/demo/status');
    isDemoMode.value = response.demoMode;
  } catch (error) {
    console.error('Error checking demo mode:', error);
    isDemoMode.value = false;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  checkDemoMode();
});
</script>

<template>
  <div v-if="isDemoMode && isDemoUser" class="fixed top-4 right-4 z-50">
    <div class="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
      <span class="mdi mdi-flask text-lg"></span>
      <span class="text-sm font-medium">Demo Mode</span>
      <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
    </div>
  </div>
</template>
