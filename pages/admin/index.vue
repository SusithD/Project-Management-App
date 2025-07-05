<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p class="text-gray-600 mt-1">Manage users, roles, and system settings</p>
      </div>
      <div class="flex items-center space-x-3">
        <div class="text-sm text-gray-500">
          Welcome back, {{ authStore.userName }}
        </div>
        <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <span class="text-primary-600 font-medium">
            {{ getInitials(authStore.userName) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Admin Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total Users -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-blue-100 rounded-full p-3">
            <span class="mdi mdi-account-group text-xl text-blue-600"></span>
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-medium text-gray-600">Total Users</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalUsers }}</p>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm text-gray-600">
            <span class="text-green-600 font-medium">+{{ stats.newUsersThisMonth }}</span>
            <span class="ml-1">this month</span>
          </div>
        </div>
      </div>

      <!-- Email Mappings -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-purple-100 rounded-full p-3">
            <span class="mdi mdi-email-arrow-right text-xl text-purple-600"></span>
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-medium text-gray-600">Email Mappings</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.emailMappings }}</p>
          </div>
        </div>
        <div class="mt-4">
          <NuxtLink 
            to="/admin/email-mappings" 
            class="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Manage mappings →
          </NuxtLink>
        </div>
      </div>

      <!-- Active Sessions -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-green-100 rounded-full p-3">
            <span class="mdi mdi-account-check text-xl text-green-600"></span>
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-medium text-gray-600">Active Sessions</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.activeSessions }}</p>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm text-gray-600">
            <span class="text-green-600 font-medium">{{ stats.usersOnlineNow }}</span>
            <span class="ml-1">online now</span>
          </div>
        </div>
      </div>

      <!-- System Health -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-emerald-100 rounded-full p-3">
            <span class="mdi mdi-shield-check text-xl text-emerald-600"></span>
          </div>
          <div class="ml-4 flex-1">
            <p class="text-sm font-medium text-gray-600">System Status</p>
            <p class="text-lg font-bold text-emerald-600">Healthy</p>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm text-gray-600">
            <span class="text-emerald-600 font-medium">99.9%</span>
            <span class="ml-1">uptime</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink 
          to="/admin/roles"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div class="flex-shrink-0 bg-indigo-100 rounded-lg p-3 group-hover:bg-indigo-200 transition-colors">
            <span class="mdi mdi-account-cog text-xl text-indigo-600"></span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-900">Manage User Roles</p>
            <p class="text-sm text-gray-600">Assign and modify user permissions</p>
          </div>
        </NuxtLink>

        <NuxtLink 
          to="/admin/email-mappings"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div class="flex-shrink-0 bg-purple-100 rounded-lg p-3 group-hover:bg-purple-200 transition-colors">
            <span class="mdi mdi-email-arrow-right text-xl text-purple-600"></span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-900">Email Role Mappings</p>
            <p class="text-sm text-gray-600">Configure automatic role assignments</p>
          </div>
        </NuxtLink>

        <NuxtLink 
          to="/users"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div class="flex-shrink-0 bg-blue-100 rounded-lg p-3 group-hover:bg-blue-200 transition-colors">
            <span class="mdi mdi-account-multiple text-xl text-blue-600"></span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-900">User Management</p>
            <p class="text-sm text-gray-600">View and manage all users</p>
          </div>
        </NuxtLink>

        <NuxtLink 
          to="/settings"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div class="flex-shrink-0 bg-gray-100 rounded-lg p-3 group-hover:bg-gray-200 transition-colors">
            <span class="mdi mdi-cog text-xl text-gray-600"></span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-900">System Settings</p>
            <p class="text-sm text-gray-600">Configure system preferences</p>
          </div>
        </NuxtLink>

        <NuxtLink 
          to="/reports"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div class="flex-shrink-0 bg-yellow-100 rounded-lg p-3 group-hover:bg-yellow-200 transition-colors">
            <span class="mdi mdi-chart-bar text-xl text-yellow-600"></span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-900">Reports</p>
            <p class="text-sm text-gray-600">View system and user reports</p>
          </div>
        </NuxtLink>

        <button 
          @click="showAuthDemo = true"
          class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div class="flex-shrink-0 bg-green-100 rounded-lg p-3 group-hover:bg-green-200 transition-colors">
            <span class="mdi mdi-shield-account text-xl text-green-600"></span>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-900">Auth Demo</p>
            <p class="text-sm text-gray-600">Test authentication features</p>
          </div>
        </button>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-medium text-gray-900">Recent Activity</h2>
        <button 
          @click="refreshActivity"
          class="text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          <span class="mdi mdi-refresh mr-1" :class="{ 'animate-spin': loadingActivity }"></span>
          Refresh
        </button>
      </div>
      
      <div v-if="loadingActivity" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
      </div>
      
      <div v-else-if="recentActivity.length === 0" class="text-center py-8">
        <span class="mdi mdi-history text-4xl text-gray-300"></span>
        <p class="text-gray-500 mt-2">No recent activity</p>
      </div>
      
      <div v-else class="space-y-4">
        <div 
          v-for="activity in recentActivity" 
          :key="activity.id"
          class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50"
        >
          <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <span :class="['mdi', getActivityIcon(activity.type), 'text-gray-600']"></span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900">{{ activity.description }}</p>
            <p class="text-xs text-gray-500">{{ formatActivityTime(activity.timestamp) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Auth Demo Modal -->
    <div v-if="showAuthDemo" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Authentication Demo</h3>
          <button @click="showAuthDemo = false" class="text-gray-400 hover:text-gray-600">
            <span class="mdi mdi-close text-xl"></span>
          </button>
        </div>
        <p class="text-gray-600 mb-4">
          This will open the authentication demo page where you can test various auth features.
        </p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="showAuthDemo = false"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <NuxtLink 
            to="/admin/auth-demo"
            @click="showAuthDemo = false"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Open Demo
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

// Define layout
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
});

// Auth store
const authStore = useAuthStore();

// Check if user has admin permissions
if (!authStore.isSuperAdmin && !authStore.isManager) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Access denied. Admin privileges required.'
  });
}

// Data
const stats = ref({
  totalUsers: 0,
  newUsersThisMonth: 0,
  emailMappings: 0,
  activeSessions: 0,
  usersOnlineNow: 0
});

const recentActivity = ref([]);
const loadingActivity = ref(false);
const showAuthDemo = ref(false);

// Methods
const getInitials = (name) => {
  if (!name) return 'A';
  return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
};

const getActivityIcon = (type) => {
  const iconMap = {
    'user_login': 'mdi-login',
    'user_created': 'mdi-account-plus',
    'role_changed': 'mdi-account-cog',
    'email_mapping': 'mdi-email-arrow-right',
    'system': 'mdi-cog'
  };
  return iconMap[type] || 'mdi-information';
};

const formatActivityTime = (timestamp) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

const fetchStats = async () => {
  try {
    // Fetch user stats
    const usersResponse = await $fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      }
    });
    
    stats.value.totalUsers = usersResponse.users?.length || 0;
    stats.value.newUsersThisMonth = usersResponse.users?.filter(user => {
      const userDate = new Date(user.createdAt);
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return userDate >= thisMonth;
    }).length || 0;
    
    // Mock active sessions (in a real app, you'd get this from your session store)
    stats.value.activeSessions = Math.floor(stats.value.totalUsers * 0.3);
    stats.value.usersOnlineNow = Math.floor(stats.value.totalUsers * 0.1);
    
    // Fetch email mappings count
    try {
      const mappingsResponse = await $fetch('/api/admin/email-role-mappings', {
        headers: {
          'Authorization': `Bearer ${authStore.accessToken}`
        }
      });
      stats.value.emailMappings = mappingsResponse.mappings?.length || 0;
    } catch (error) {
      console.warn('Could not fetch email mappings:', error);
      stats.value.emailMappings = 0;
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error);
  }
};

const refreshActivity = async () => {
  loadingActivity.value = true;
  try {
    // In a real app, you'd fetch this from an activity log API
    // For now, we'll create some mock data
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    
    recentActivity.value = [
      {
        id: 1,
        type: 'user_login',
        description: 'John Doe logged in',
        timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        id: 2,
        type: 'role_changed',
        description: 'Jane Smith\'s role was updated to Manager',
        timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        id: 3,
        type: 'user_created',
        description: 'New user Bob Wilson was created',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 4,
        type: 'email_mapping',
        description: 'Email mapping added for developer@company.com',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ];
  } catch (error) {
    console.error('Error fetching activity:', error);
  } finally {
    loadingActivity.value = false;
  }
};

// Load data on mount
onMounted(async () => {
  await Promise.all([
    fetchStats(),
    refreshActivity()
  ]);
});
</script>