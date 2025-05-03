<script setup>
// Redirect to login page
onMounted(() => {
  navigateTo('/login');
});
</script>

<template>
  <div class="flex items-center justify-center h-screen">
    <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
  </div>
</template>