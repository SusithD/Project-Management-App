<script setup>
import { ref, inject, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const user = inject('user', ref(null));
const isMobileMenuOpen = ref(false);

// Computed properties for user information
const userName = computed(() => {
  if (user && user.value && user.value.name) {
    return user.value.name;
  }
  return authStore.userFullName || 'User';
});

const userRole = computed(() => {
  return authStore.roleName || authStore.role || 'User';
});

// Navigation items with role-based filtering
const allNavItems = [
  { 
    label: 'Dashboard', 
    icon: 'mdi-view-dashboard-outline', 
    route: '/dashboard',
    requiredResource: 'projects',
    requiredAction: 'read',
    active: computed(() => router.currentRoute.value.path === '/dashboard')
  },
  { 
    label: 'Projects', 
    icon: 'mdi-folder-multiple-outline', 
    route: '/projects',
    requiredResource: 'projects',
    requiredAction: 'read',
    active: computed(() => router.currentRoute.value.path.startsWith('/projects'))
  },
  { 
    label: 'My Tasks', 
    icon: 'mdi-checkbox-multiple-outline', 
    route: '/tasks',
    requiredResource: 'tasks',
    requiredAction: 'read',
    active: computed(() => router.currentRoute.value.path.startsWith('/tasks'))
  },
  { 
    label: 'Users', 
    icon: 'mdi-account-group-outline', 
    route: '/users',
    requiredResource: 'users',
    requiredAction: 'read',
    active: computed(() => router.currentRoute.value.path.startsWith('/users'))
  },
  {
    label: 'Employee Projects',
    icon: 'mdi-account-tie',
    route: '/employees/projects',
    requiredResource: 'projects',
    requiredAction: 'read',
    active: computed(() => router.currentRoute.value.path.startsWith('/employees/projects'))
  },
  { 
    label: 'Reports', 
    icon: 'mdi-chart-box-outline', 
    route: '/reports',
    requiredResource: 'reports',
    requiredAction: 'read',
    active: computed(() => router.currentRoute.value.path.startsWith('/reports'))
  },
  { 
    label: 'Settings', 
    icon: 'mdi-cog-outline', 
    route: '/settings',
    requiredResource: 'users',
    requiredAction: 'update',
    active: computed(() => router.currentRoute.value.path.startsWith('/settings'))
  }
];

// Filter navigation items based on user permissions
const navItems = computed(() => {
  return allNavItems.filter(item => {
    if (!item.requiredResource || !item.requiredAction) {
      return true; // Show items without permission requirements
    }
    return authStore.hasPermission(item.requiredResource, item.requiredAction);
  });
});

// Additional workspace items with role restrictions
const workspaceItems = computed(() => {
  const items = [];
  
  if (authStore.canAccessResource('reports')) {
    items.push({
      label: 'Analytics',
      icon: 'mdi-chart-line',
      route: '/reports',
      active: router.currentRoute.value.path.startsWith('/reports')
    });
  }
  
  if (authStore.canAccessResource('users') && (authStore.isManager || authStore.isSuperAdmin)) {
    items.push({
      label: 'Admin Panel',
      icon: 'mdi-shield-crown',
      route: '/admin',
      active: router.currentRoute.value.path.startsWith('/admin')
    });
  }
  
  return items;
});

// Toggle mobile menu
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

// Navigate to a route and close mobile menu
const navigate = (route) => {
  router.push(route);
  isMobileMenuOpen.value = false;
};

// Handle user logout
const handleLogout = () => {
  authStore.clearUser();
  router.push('/login');
  isMobileMenuOpen.value = false;
};
</script>

<template>
  <!-- Mobile menu button -->
  <button 
    @click="toggleMobileMenu" 
    class="md:hidden fixed top-4 left-4 z-50 bg-primary-600/90 hover:bg-primary-700 text-white p-2 rounded-lg shadow-md transition-all duration-200"
  >
    <span class="mdi mdi-menu text-xl"></span>
  </button>
  
  <!-- Sidebar for desktop -->
  <aside class="hidden md:flex flex-col w-64 bg-white dark:bg-primary-700 border-r border-gray-200 dark:border-gray-800 shadow-sm">
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
                @click.prevent="navigate(item.route)" 
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
                    item.active ? 'text-primary-600 dark:text-primary-100' : 'text-gray-500 dark:text-gray-400'
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
        
        <!-- Workspace section - only show if user has additional items -->
        <div v-if="workspaceItems.length > 0">
          <div class="px-2 py-2">
            <div class="h-px bg-gray-100 dark:bg-gray-400"></div>
          </div>
          
          <div>
            <div class="px-4 mb-2">
              <h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Workspace</h2>
            </div>
            
            <ul class="space-y-1 px-2">
              <li v-for="item in workspaceItems" :key="item.label">
                <a 
                  @click.prevent="navigate(item.route)" 
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
                  <span>{{ item.label }}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
    
    <div class="p-4 border-t border-gray-200 dark:border-gray-500">
      <div class="flex items-center">
        <div class="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-sm overflow-hidden">
          <span class="mdi mdi-account text-lg text-gray-600 dark:text-gray-300"></span>
        </div>
        <div class="ml-3 flex-grow">
          <p class="text-sm font-medium text-gray-800 dark:text-white truncate">{{ userName }}</p>
          <div class="flex items-center mt-1">
            <RoleBadge :role="authStore.role" v-if="authStore.role" />
          </div>
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
  
  <!-- Mobile sidebar -->
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
                @click.prevent="navigate(item.route)" 
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
        
        <!-- Mobile workspace section -->
        <div v-if="workspaceItems.length > 0">
          <div class="px-2 py-2">
            <div class="h-px bg-gray-200 dark:bg-gray-800"></div>
          </div>
          
          <div>
            <div class="px-4 mb-2">
              <h2 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Workspace</h2>
            </div>
            
            <ul class="space-y-1 px-2">
              <li v-for="item in workspaceItems" :key="item.label">
                <a 
                  @click.prevent="navigate(item.route)" 
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
                </a>
              </li>
            </ul>
          </div>
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
          <div class="mt-1">
            <RoleBadge :role="authStore.role" v-if="authStore.role" />
          </div>
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
  
  <!-- Overlay for mobile -->
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