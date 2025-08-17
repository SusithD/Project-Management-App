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
    
    <!-- Demo Mode Indicator -->
    <DemoModeIndicator />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue';
import { useAuthStore } from '~/stores/auth';
import AppSidebar from '~/components/app/Sidebar.vue';
import AppHeader from '~/components/app/Header.vue';
import AppNotifications from '~/components/app/Notifications.vue';
import DemoModeIndicator from '~/components/common/DemoModeIndicator.vue';

// Get the authentication store
const authStore = useAuthStore();

// Create a user ref for components that need it
const user = ref(authStore.user);

// Provide user data to child components
provide('user', user);

// Provide logout function to child components
provide('logout', () => {
  authStore.clearUser();
  navigateTo('/login');
});
</script>