<script setup>
import { ref, inject, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const user = inject('user', ref(null)); // Provide a default value
const isMobileMenuOpen = ref(false);

// Computed properties for user information
const userName = computed(() => {
  // First check if user exists and has a value
  if (user && user.value && user.value.name) {
    return user.value.name;
  }
  return authStore.userFullName || 'User';
});

const userRole = computed(() => {
  return authStore.role || 'User';
});

// Navigation items
const navItems = [
  { 
    label: 'Dashboard', 
    icon: 'mdi-view-dashboard', 
    route: '/dashboard',
    active: computed(() => router.currentRoute.value.path === '/dashboard')
  },
  { 
    label: 'Projects', 
    icon: 'mdi-folder-multiple', 
    route: '/projects',
    active: computed(() => router.currentRoute.value.path.startsWith('/projects'))
  },
  { 
    label: 'My Tasks', 
    icon: 'mdi-checkbox-marked-outline', 
    route: '/tasks',
    active: computed(() => router.currentRoute.value.path.startsWith('/tasks'))
  },
  { 
    label: 'Reports', 
    icon: 'mdi-chart-bar', 
    route: '/reports',
    active: computed(() => router.currentRoute.value.path.startsWith('/reports'))
  },
  { 
    label: 'Settings', 
    icon: 'mdi-cog', 
    route: '/settings',
    active: computed(() => router.currentRoute.value.path.startsWith('/settings'))
  }
];

// Toggle mobile menu
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

// Navigate to a route and close mobile menu
const navigateTo = (route) => {
  router.push(route);
  isMobileMenuOpen.value = false;
};
</script>

<template>
  <!-- Mobile menu button -->
  <button 
    @click="toggleMobileMenu" 
    class="md:hidden fixed top-4 left-4 z-50 bg-primary-600 text-white p-2 rounded-md"
  >
    <span class="mdi mdi-menu text-xl"></span>
  </button>
  
  <!-- Sidebar for desktop -->
  <aside class="hidden md:flex flex-col w-64 bg-primary-600 text-white">
    <div class="p-4 border-b border-primary-500">
      <h1 class="text-xl font-bold">Project Manager</h1>
    </div>
    
    <nav class="flex-1 overflow-y-auto py-4">
      <ul>
        <li v-for="item in navItems" :key="item.label" class="mb-1">
          <a 
            @click.prevent="navigateTo(item.route)" 
            :class="[
              'flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors',
              item.active 
                ? 'bg-primary-700 text-white' 
                : 'text-primary-100 hover:bg-primary-500 hover:text-white'
            ]"
          >
            <span :class="`mdi ${item.icon} text-xl mr-3`"></span>
            {{ item.label }}
          </a>
        </li>
      </ul>
    </nav>
    
    <div class="p-4 border-t border-primary-500">
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center">
          <span class="mdi mdi-account text-lg"></span>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ userName }}</p>
          <p class="text-xs text-primary-200">{{ userRole }}</p>
        </div>
      </div>
    </div>
  </aside>
  
  <!-- Mobile sidebar -->
  <aside 
    v-show="isMobileMenuOpen" 
    class="md:hidden fixed inset-0 z-40 flex flex-col w-64 bg-primary-600 text-white shadow-lg transform transition-transform duration-300 ease-in-out"
  >
    <div class="p-4 border-b border-primary-500 flex justify-between items-center">
      <h1 class="text-xl font-bold">Project Manager</h1>
      <button @click="toggleMobileMenu" class="text-white">
        <span class="mdi mdi-close text-xl"></span>
      </button>
    </div>
    
    <nav class="flex-1 overflow-y-auto py-4">
      <ul>
        <li v-for="item in navItems" :key="item.label" class="mb-1">
          <a 
            @click.prevent="navigateTo(item.route)" 
            :class="[
              'flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors',
              item.active 
                ? 'bg-primary-700 text-white' 
                : 'text-primary-100 hover:bg-primary-500 hover:text-white'
            ]"
          >
            <span :class="`mdi ${item.icon} text-xl mr-3`"></span>
            {{ item.label }}
          </a>
        </li>
      </ul>
    </nav>
    
    <div class="p-4 border-t border-primary-500">
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center">
          <span class="mdi mdi-account text-lg"></span>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ userName }}</p>
          <p class="text-xs text-primary-200">{{ userRole }}</p>
        </div>
      </div>
    </div>
  </aside>
  
  <!-- Overlay for mobile -->
  <div 
    v-if="isMobileMenuOpen" 
    @click="toggleMobileMenu"
    class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
  ></div>
</template>