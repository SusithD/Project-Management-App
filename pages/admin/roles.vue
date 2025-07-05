<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Role Management</h1>
        <p class="text-gray-600 mt-1">Manage user roles and permissions</p>
      </div>
      <div class="flex space-x-3">
        <button 
          @click="refreshUsers"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span class="mdi mdi-refresh mr-2"></span>
          Refresh
        </button>
        <button 
          v-if="authStore.isSuperAdmin"
          @click="showBulkUpdate = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <span class="mdi mdi-account-multiple mr-2"></span>
          Bulk Update
        </button>
      </div>
    </div>

    <!-- Role Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div 
        v-for="(roleInfo, roleKey) in roleStats" 
        :key="roleKey"
        class="bg-white rounded-lg border border-gray-200 p-4"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">{{ roleInfo.name }}</p>
            <p class="text-2xl font-bold text-gray-900">{{ roleInfo.count }}</p>
          </div>
          <div :class="['w-3 h-3 rounded-full', getRoleDotColor(roleKey)]"></div>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900">Users & Roles</h2>
          <div class="flex items-center space-x-3">
            <!-- Search -->
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <span class="mdi mdi-magnify text-lg"></span>
              </span>
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="Search users..." 
                class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
            </div>
            <!-- Role Filter -->
            <select 
              v-model="roleFilter" 
              class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option v-for="(roleInfo, roleKey) in ROLES" :key="roleKey" :value="roleKey">
                {{ roleInfo.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permissions
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span class="text-primary-600 font-medium">
                      {{ getInitials(user.name) }}
                    </span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                    <div class="text-sm text-gray-500">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <RoleBadge :role="user.role" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(user.lastActive) }}
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="permission in getUserPermissions(user.role)" 
                    :key="`${permission.resource}-${permission.actions.join(',')}`"
                    class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ permission.resource }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  v-if="canEditUserRole(user)"
                  @click="openRoleEditor(user)"
                  class="text-primary-600 hover:text-primary-900 mr-3"
                >
                  Edit Role
                </button>
                <button 
                  @click="viewUserDetails(user)"
                  class="text-gray-600 hover:text-gray-900"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredUsers.length === 0" class="text-center py-12">
        <span class="mdi mdi-account-search text-4xl text-gray-400"></span>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No users found</h3>
        <p class="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
      </div>
    </div>

    <!-- Role Editor Modal -->
    <div v-if="showRoleEditor" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Edit Role: {{ selectedUser?.name }}
        </h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Current Role
            </label>
            <div class="mb-3">
              <RoleBadge :role="selectedUser?.role" v-if="selectedUser?.role" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              New Role
            </label>
            <select 
              v-model="newRole" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option v-for="(roleInfo, roleKey) in ROLES" :key="roleKey" :value="roleKey">
                {{ roleInfo.name }} (Level {{ roleInfo.hierarchy }})
              </option>
            </select>
          </div>

          <div v-if="newRole" class="bg-gray-50 p-3 rounded-lg">
            <h4 class="text-sm font-medium text-gray-700 mb-2">New Permissions:</h4>
            <div class="flex flex-wrap gap-1">
              <span 
                v-for="permission in ROLES[newRole]?.permissions || []" 
                :key="`${permission.resource}-${permission.actions.join(',')}`"
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
              >
                {{ permission.resource }}: {{ permission.actions.join(', ') }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button 
            @click="closeRoleEditor"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            @click="updateUserRole"
            :disabled="!newRole || newRole === selectedUser?.role"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Role
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { ROLES } from '~/server/config/roles';

// Auth store
const authStore = useAuthStore();

// Data
const users = ref([]);
const loading = ref(false);
const searchQuery = ref('');
const roleFilter = ref('');
const showRoleEditor = ref(false);
const showBulkUpdate = ref(false);
const selectedUser = ref(null);
const newRole = ref('');

// Computed
const roleStats = computed(() => {
  const stats = {};
  Object.keys(ROLES).forEach(roleKey => {
    stats[roleKey] = {
      name: ROLES[roleKey].name,
      count: users.value.filter(user => user.role === roleKey).length
    };
  });
  return stats;
});

const filteredUsers = computed(() => {
  let filtered = users.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query)
    );
  }
  
  if (roleFilter.value) {
    filtered = filtered.filter(user => user.role === roleFilter.value);
  }
  
  return filtered;
});

// Methods
const refreshUsers = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/users');
    users.value = response.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    loading.value = false;
  }
};

const getRoleDotColor = (roleKey) => {
  const colorMap = {
    'SUPER_ADMIN': 'bg-red-400',
    'MANAGER': 'bg-purple-400',
    'BUSINESS_ANALYST': 'bg-blue-400',
    'DEVELOPER': 'bg-green-400',
    'DESIGNER': 'bg-pink-400',
    'HR': 'bg-orange-400'
  };
  return colorMap[roleKey] || 'bg-gray-400';
};

const getInitials = (name) => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString();
};

const getUserPermissions = (roleKey) => {
  return ROLES[roleKey]?.permissions || [];
};

const canEditUserRole = (user) => {
  // Super admins can edit anyone
  if (authStore.isSuperAdmin) return true;
  // Managers can edit roles below their level
  if (authStore.isManager) {
    const userRoleLevel = ROLES[user.role]?.hierarchy || 0;
    const currentUserLevel = ROLES[authStore.role]?.hierarchy || 0;
    return userRoleLevel < currentUserLevel;
  }
  return false;
};

const openRoleEditor = (user) => {
  selectedUser.value = user;
  newRole.value = user.role;
  showRoleEditor.value = true;
};

const closeRoleEditor = () => {
  showRoleEditor.value = false;
  selectedUser.value = null;
  newRole.value = '';
};

const updateUserRole = async () => {
  try {
    // In a real app, you would call an API to update the user role
    const response = await $fetch(`/api/users/${selectedUser.value.id}`, {
      method: 'PUT',
      body: {
        role: newRole.value
      }
    });
    
    // Update local user data
    const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id);
    if (userIndex !== -1) {
      users.value[userIndex].role = newRole.value;
    }
    
    closeRoleEditor();
    
    // Show success message
    console.log('User role updated successfully');
  } catch (error) {
    console.error('Error updating user role:', error);
  }
};

const viewUserDetails = (user) => {
  // Navigate to user details page or open modal
  console.log('View user details:', user);
};

// Lifecycle
onMounted(() => {
  refreshUsers();
});

// Check if user has permission to access this page
if (!authStore.canAccessResource('users')) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Access denied. You do not have permission to manage users.'
  });
}
</script>