<script setup>
import { ref, inject, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';

const logout = inject('logout');
const user = inject('user', ref(null)); 
const authStore = useAuthStore();
const searchQuery = ref('');
const isNotificationsOpen = ref(false);
const isProfileOpen = ref(false);

// Computed properties for user information
const userName = computed(() => {
  // First check if user exists and has a value
  if (user && user.value && user.value.name) {
    return user.value.name;
  }
  return authStore.userFullName || 'User';
});

const userEmail = computed(() => {
  // First check if user exists and has a value
  if (user && user.value && user.value.username) {
    return user.value.username;
  }
  return authStore.userEmail || 'user@example.com';
});

// Toggle notifications dropdown
const toggleNotifications = () => {
  isNotificationsOpen.value = !isNotificationsOpen.value;
  if (isNotificationsOpen.value) isProfileOpen.value = false;
};

// Toggle profile dropdown
const toggleProfile = () => {
  isProfileOpen.value = !isProfileOpen.value;
  if (isProfileOpen.value) isNotificationsOpen.value = false;
};

// Close dropdowns when clicking outside
const closeDropdowns = () => {
  isNotificationsOpen.value = false;
  isProfileOpen.value = false;
};

// Sample notifications
const notifications = [
  { id: 1, message: 'Project "Website Redesign" is 90% complete', time: '2 hours ago', read: false },
  { id: 2, message: 'New task assigned to you: Update documentation', time: '5 hours ago', read: false },
  { id: 3, message: 'Project "Mobile App" deadline is approaching', time: 'Yesterday', read: true },
];
</script>

<template>
  <header class="bg-white shadow-sm z-10">
    <div class="px-4 py-3 flex items-center justify-between">
      <!-- Search Bar -->
      <div class="relative max-w-md w-full mr-4 hidden md:block">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
          <span class="mdi mdi-magnify text-lg"></span>
        </span>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search projects..." 
          class="w-full pl-10 pr-4 py-2 rounded-md bg-neutral-100 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
      </div>
      
      <!-- Mobile Search Button -->
      <button class="md:hidden p-2 rounded-md text-neutral-500 hover:bg-neutral-100">
        <span class="mdi mdi-magnify text-xl"></span>
      </button>
      
      <!-- Right Actions -->
      <div class="flex items-center space-x-2">        
        <!-- Notifications -->
        <div class="relative">
          <button 
            @click.stop="toggleNotifications" 
            class="p-2 rounded-md text-neutral-500 hover:bg-neutral-100 relative"
          >
            <span class="mdi mdi-bell text-xl"></span>
            <span v-if="notifications.filter(n => !n.read).length > 0" class="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
          </button>
          
          <!-- Notifications Dropdown -->
          <div 
            v-show="isNotificationsOpen"
            class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-elevated overflow-hidden z-50"
          >
            <div class="p-3 border-b border-neutral-200 flex justify-between items-center">
              <h3 class="font-medium">Notifications</h3>
              <button class="text-sm text-primary-600 hover:text-primary-700">Mark all as read</button>
            </div>
            <div class="max-h-72 overflow-y-auto">
              <div 
                v-for="notification in notifications" 
                :key="notification.id"
                :class="['p-3 border-b border-neutral-100 hover:bg-neutral-50', !notification.read ? 'bg-primary-50' : '']"
              >
                <p class="text-sm">{{ notification.message }}</p>
                <p class="text-xs text-neutral-500 mt-1">{{ notification.time }}</p>
              </div>
            </div>
            <div class="p-2 text-center border-t border-neutral-200">
              <a href="#" class="text-sm text-primary-600 hover:text-primary-700">View all notifications</a>
            </div>
          </div>
        </div>
        
        <!-- Profile -->
        <div class="relative">
          <button 
            @click.stop="toggleProfile" 
            class="flex items-center focus:outline-none"
          >
            <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white">
              <span class="mdi mdi-account text-lg"></span>
            </div>
          </button>
          
          <!-- Profile Dropdown -->
          <div 
            v-show="isProfileOpen"
            class="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-elevated overflow-hidden z-50"
          >
            <div class="p-4 border-b border-neutral-200">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white">
                  <span class="mdi mdi-account text-xl"></span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 truncate">{{ userName }}</p>
                  <p class="text-sm text-gray-500 truncate">{{ userEmail }}</p>
                  <!-- Role Badge -->
                  <div class="mt-2">
                    <RoleBadge :role="authStore.role" v-if="authStore.role" />
                  </div>
                </div>
              </div>
            </div>
            <ul>
              <li>
                <a href="/profile" class="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                  <span class="mdi mdi-account-outline mr-2"></span>
                  My Profile
                </a>
              </li>
              <li v-if="authStore.canAccessResource('users')">
                <a href="/settings" class="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                  <span class="mdi mdi-cog-outline mr-2"></span>
                  Settings
                </a>
              </li>
              <li v-if="authStore.canAccessResource('users')">
                <a href="/users" class="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                  <span class="mdi mdi-account-group-outline mr-2"></span>
                  User Management
                </a>
              </li>
              <li v-if="authStore.canAccessResource('reports')">
                <a href="/reports" class="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                  <span class="mdi mdi-chart-line mr-2"></span>
                  Reports
                </a>
              </li>
              <li class="border-t border-neutral-200">
                <button @click="logout" class="w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-neutral-50">
                  <span class="mdi mdi-logout mr-2"></span>
                  Sign out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </header>
  
  <!-- Click outside handler -->
  <div v-if="isNotificationsOpen || isProfileOpen" @click="closeDropdowns" class="fixed inset-0 z-40"></div>
</template>