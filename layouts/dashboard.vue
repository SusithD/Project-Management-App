<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <AppSidebar />
    
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <AppHeader />
      <main class="flex-1 overflow-y-auto bg-neutral-100 p-4 md:p-6">
        <slot />
      </main>
    </div>
    
    <!-- Notifications -->
    <AppNotifications />
  </div>
</template>

<script setup>
import AppNotifications from '~/components/app/Notifications.vue';
</script>