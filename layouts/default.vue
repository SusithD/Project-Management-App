<template>
  <div>
    <AppAuth>
      <slot />
    </AppAuth>
    
    <!-- Notifications -->
    <AppNotifications />
  </div>
</template>

<script setup>
import AppNotifications from '~/components/app/Notifications.vue';
</script>