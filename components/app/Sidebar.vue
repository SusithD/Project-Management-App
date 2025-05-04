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
    icon: 'mdi-view-dashboard-outline', 
    route: '/dashboard',
    active: computed(() => router.currentRoute.value.path === '/dashboard')
  },
  { 
    label: 'Projects', 
    icon: 'mdi-folder-multiple-outline', 
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
    icon: 'mdi-chart-box-outline', 
    route: '/reports',
    active: computed(() => router.currentRoute.value.path.startsWith('/reports'))
  },
  { 
    label: 'Settings', 
    icon: 'mdi-cog-outline', 
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

// Handle user logout
const handleLogout = () => {
  // Clear user authentication data from store
  authStore.clearUser();
  // Redirect to login page
  router.push('/login');
  // Close mobile menu if open
  isMobileMenuOpen.value = false;
};
</script>

<template>
  <!-- Mobile menu button with cleaner look -->
  <button 
    @click="toggleMobileMenu" 
    class="md:hidden fixed top-4 left-4 z-50 bg-primary-600/90 hover:bg-primary-700 text-white p-2 rounded-lg shadow-md transition-all duration-200"
  >
    <span class="mdi mdi-menu text-xl"></span>
  </button>
  
  <!-- Sidebar for desktop with modern minimal design -->
  <aside class="hidden md:flex flex-col w-64 bg-white dark:bg-primary-600 border-r border-gray-200 dark:border-gray-800 shadow-sm">
    <div class="p-5 flex items-center">
      <span class="mdi mdi-cube-outline text-xl mr-3 text-primary-600 dark:text-primary-400"></span>
      <h1 class="text-lg font-medium text-gray-800 dark:text-white">Project Manager</h1>
    </div>
    
    <nav class="flex-1 overflow-y-auto py-4">
      <div class="px-4 mb-6">
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <span class="mdi mdi-magnify text-lg"></span>
          </span>
          <input 
            type="text" 
            placeholder="Search..." 
            class="w-full py-2 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-primary-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
          >
        </div>
      </div>
      
      <div class="space-y-6">
        <div>
          <div class="px-4 mb-2">
            <h2 class="text-xs font-medium text-gray-500 dark:text-gray-100 uppercase tracking-wider">Main Menu</h2>
          </div>
          
          <ul class="space-y-1 px-2">
            <li v-for="item in navItems" :key="item.label">
              <a 
                @click.prevent="navigateTo(item.route)" 
                :class="[
                  'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200',
                  item.active 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-100 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                ]"
              >
                <span 
                  :class="[
                    `mdi ${item.icon} text-xl mr-3`,
                    item.active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  ]"
                ></span>
                <span>{{ item.label }}</span>
                <span v-if="item.badge" class="ml-auto bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-medium px-2 py-0.5 rounded-full">
                  {{ item.badge }}
                </span>
              </a>
            </li>
          </ul>
        </div>
        
        <div class="px-2 py-2">
          <div class="h-px bg-gray-100 dark:bg-gray-400"></div>
        </div>
        
        <div>
          <div class="px-4 mb-2">
            <h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Workspace</h2>
          </div>
          
          <ul class="space-y-1 px-2">
            <li>
              <a 
                @click.prevent="navigateTo('/reports')" 
                :class="[
                  'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200',
                  router.currentRoute.value.path.startsWith('/reports')
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                ]"
              >
                <span 
                  :class="[
                    'mdi mdi-chart-line text-xl mr-3',
                    router.currentRoute.value.path.startsWith('/reports') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  ]"
                ></span>
                <span>Analytics</span>
              </a>
            </li>
            <li>
              <a 
                @click.prevent="navigateTo('/settings')" 
                :class="[
                  'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200',
                  router.currentRoute.value.path.startsWith('/settings')
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                ]"
              >
                <span 
                  :class="[
                    'mdi mdi-cog-outline text-xl mr-3',
                    router.currentRoute.value.path.startsWith('/settings') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  ]"
                ></span>
                <span>Settings</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    
    <div class="p-4 border-t border-gray-200 dark:border-gray-500">
      <div class="flex items-center">
        <div class="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-sm overflow-hidden">
          <span class="mdi mdi-account text-lg text-gray-600 dark:text-gray-300"></span>
        </div>
        <div class="ml-3 flex-grow">
          <p class="text-sm font-medium text-gray-800 dark:text-white">{{ userName }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
            {{ userRole }}
          </p>
        </div>
        <button 
          @click="handleLogout" 
          class="ml-2 p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          title="Logout"
        >
          <span class="mdi mdi-logout text-lg"></span>
        </button>
      </div>
    </div>
  </aside>
  
  <!-- Mobile sidebar with clean modern design -->
  <aside 
    v-show="isMobileMenuOpen" 
    class="md:hidden fixed inset-0 z-40 flex flex-col w-72 bg-white dark:bg-gray-900 shadow-xl transform transition-all duration-300 ease-in-out"
  >
    <div class="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
      <div class="flex items-center">
        <span class="mdi mdi-cube-outline text-xl mr-3 text-primary-600 dark:text-primary-400"></span>
        <h1 class="text-lg font-medium text-gray-800 dark:text-white">Project Manager</h1>
      </div>
      <button @click="toggleMobileMenu" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
        <span class="mdi mdi-close text-xl"></span>
      </button>
    </div>
    
    <div class="px-4 mt-4 mb-4">
      <div class="relative">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
          <span class="mdi mdi-magnify text-lg"></span>
        </span>
        <input 
          type="text" 
          placeholder="Search..." 
          class="w-full py-2 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
        >
      </div>
    </div>
    
    <nav class="flex-1 overflow-y-auto">
      <div class="space-y-6 p-2">
        <div>
          <div class="px-4 mb-2">
            <h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Main Menu</h2>
          </div>
          
          <ul class="space-y-1 px-2">
            <li v-for="item in navItems" :key="item.label">
              <a 
                @click.prevent="navigateTo(item.route)" 
                :class="[
                  'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200',
                  item.active 
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                ]"
              >
                <span 
                  :class="[
                    `mdi ${item.icon} text-xl mr-3`,
                    item.active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  ]"
                ></span>
                {{ item.label }}
                <span v-if="item.badge" class="ml-auto bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs font-medium px-2 py-0.5 rounded-full">
                  {{ item.badge }}
                </span>
              </a>
            </li>
          </ul>
        </div>
        
        <div class="px-2 py-2">
          <div class="h-px bg-gray-200 dark:bg-gray-800"></div>
        </div>
        
        <div>
          <div class="px-4 mb-2">
            <h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Workspace</h2>
          </div>
          
          <ul class="space-y-1 px-2">
            <li>
              <a 
                @click.prevent="navigateTo('/reports')" 
                :class="[
                  'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200',
                  router.currentRoute.value.path.startsWith('/reports')
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                ]"
              >
                <span 
                  :class="[
                    'mdi mdi-chart-line text-xl mr-3',
                    router.currentRoute.value.path.startsWith('/reports') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  ]"
                ></span>
                Analytics
              </a>
            </li>
            <li>
              <a 
                @click.prevent="navigateTo('/settings')" 
                :class="[
                  'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200',
                  router.currentRoute.value.path.startsWith('/settings')
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400'
                ]"
              >
                <span 
                  :class="[
                    'mdi mdi-cog-outline text-xl mr-3',
                    router.currentRoute.value.path.startsWith('/settings') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  ]"
                ></span>
                Settings
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    
    <div class="p-4 border-t border-gray-200 dark:border-gray-800">
      <div class="flex items-center">
        <div class="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-sm overflow-hidden">
          <span class="mdi mdi-account text-lg text-gray-600 dark:text-gray-300"></span>
        </div>
        <div class="ml-3 flex-grow">
          <p class="text-sm font-medium text-gray-800 dark:text-white">{{ userName }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
            {{ userRole }}
          </p>
        </div>
        <button 
          @click="handleLogout" 
          class="ml-2 p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          title="Logout"
        >
          <span class="mdi mdi-logout text-lg"></span>
        </button>
      </div>
    </div>
  </aside>
  
  <!-- Overlay for mobile with smooth transition -->
  <div 
    v-if="isMobileMenuOpen" 
    @click="toggleMobileMenu"
    class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 backdrop-blur-sm transition-opacity duration-300"
  ></div>
</template>

<style scoped>
/* Subtle hover effect for menu items */
a {
  transition: all 0.2s ease;
}

/* Slight indicator animation for active menu item */
a[class*="bg-primary-50"], a[class*="bg-primary-900"] {
  position: relative;
}

a[class*="bg-primary-50"]::before, a[class*="bg-primary-900"]::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 60%;
  width: 3px;
  background-color: currentColor;
  border-radius: 0 3px 3px 0;
  opacity: 0.7;
}
</style>