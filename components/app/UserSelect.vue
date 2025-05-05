<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useUsersStore } from '~/stores/users';

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select a user'
  },
  multiple: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  filterRole: {
    type: String,
    default: null
  },
  size: {
    type: String,
    default: 'medium' // 'small', 'medium', 'large'
  },
  groupByRole: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue']);

// Use the users store
const usersStore = useUsersStore();

// Local state
const isOpen = ref(false);
const searchQuery = ref('');
const inputRef = ref(null);
const dropdownRef = ref(null);
const loadingUsers = ref(false);
const fetchError = ref(null);

// Fetch users if needed
onMounted(async () => {
  // Ensure we load users even if there was a previous error
  if (usersStore.users.length === 0 || usersStore.error) {
    loadingUsers.value = true;
    try {
      await usersStore.fetchUsers();
      fetchError.value = null;
    } catch (error) {
      fetchError.value = error.message || 'Failed to load users';
      console.error('Error loading users in UserSelect:', error);
    } finally {
      loadingUsers.value = false;
    }
  }
});

// Filter users based on search query and role filter
const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase();
  
  // Check if users array exists and has items
  if (!usersStore.users || usersStore.users.length === 0) {
    return [];
  }
  
  // Start with all users or filter by role if specified
  let users = props.filterRole 
    ? usersStore.users.filter(user => user.role === props.filterRole)
    : usersStore.users;
  
  // Filter by search query
  if (query) {
    users = users.filter(user => {
      return user.name?.toLowerCase().includes(query) || 
             user.email?.toLowerCase().includes(query) ||
             (user.role && user.role.toLowerCase().includes(query));
    });
  }
  
  // Sort alphabetically by name
  return users.sort((a, b) => a.name?.localeCompare(b.name));
});

// Group users by role for better organization
const usersByRole = computed(() => {
  // Get unique roles
  const roles = [...new Set(filteredUsers.value.map(user => user.role))].sort();
  
  // Group users by role
  return roles.map(role => ({
    role,
    users: filteredUsers.value.filter(user => user.role === role)
  }));
});

// Handle selecting a user
const selectUser = (userId) => {
  if (props.multiple) {
    const selectedIds = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    
    if (selectedIds.includes(userId)) {
      // Remove if already selected
      const index = selectedIds.indexOf(userId);
      selectedIds.splice(index, 1);
    } else {
      // Add if not selected
      selectedIds.push(userId);
    }
    
    emit('update:modelValue', selectedIds);
  } else {
    // Single select - just emit the ID
    emit('update:modelValue', userId);
    isOpen.value = false;
  }
};

// Check if a user is selected
const isSelected = (userId) => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(userId);
  }
  return props.modelValue === userId;
};

// Get selected users' information for display
const selectedUsers = computed(() => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue
      .map(id => usersStore.users.find(user => user.id === id))
      .filter(Boolean); // Remove any undefined values
  } else if (!props.multiple && props.modelValue) {
    const user = usersStore.users.find(user => user.id === props.modelValue);
    return user ? [user] : [];
  }
  return [];
});

// Display name for single select
const selectedUserName = computed(() => {
  if (props.modelValue && !props.multiple) {
    const user = usersStore.users.find(user => user.id === props.modelValue);
    return user ? user.name : '';
  }
  return '';
});

// Select all visible users (for multiple select)
const selectAll = () => {
  if (props.multiple) {
    const currentIds = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const filteredIds = filteredUsers.value.map(user => user.id);
    
    // Add all filtered users that aren't already selected
    const newIds = [...new Set([...currentIds, ...filteredIds])];
    emit('update:modelValue', newIds);
  }
};

// Clear selection
const clearSelection = () => {
  if (props.multiple) {
    emit('update:modelValue', []);
  } else {
    emit('update:modelValue', '');
  }
};

// Handle click outside to close dropdown
const handleClickOutside = (event) => {
  if (isOpen.value && dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
    searchQuery.value = '';
  }
};

// Toggle dropdown
const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
      searchQuery.value = '';
      // Focus search input when opening
      setTimeout(() => {
        inputRef.value?.focus();
      }, 100);
    }
  }
};

// Focus management
const focusInput = () => {
  inputRef.value?.focus();
};

// Watch for clicks outside
watch(isOpen, (value) => {
  if (value) {
    document.addEventListener('click', handleClickOutside);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
});

// Clean up event listeners
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Remove a selected user (for multiple select with tags)
const removeUser = (userId) => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    const selectedIds = [...props.modelValue];
    const index = selectedIds.indexOf(userId);
    if (index !== -1) {
      selectedIds.splice(index, 1);
      emit('update:modelValue', selectedIds);
    }
  }
};

// Get size class
const sizeClass = computed(() => {
  switch (props.size) {
    case 'small': return 'text-sm py-1.5 px-3';
    case 'large': return 'text-base py-3 px-4';
    default: return 'text-sm py-2 px-3';
  }
});

// Manual refresh function to retry loading users
const refreshUsers = async () => {
  loadingUsers.value = true;
  try {
    await usersStore.fetchUsers();
    fetchError.value = null;
  } catch (error) {
    fetchError.value = error.message || 'Failed to load users';
  } finally {
    loadingUsers.value = false;
  }
};

// Add loading state - use local loading state for better UX
const loading = computed(() => loadingUsers.value || usersStore.loading);

// Handle keyboard navigation
const handleKeyDown = (event) => {
  if (!isOpen.value) {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault();
      isOpen.value = true;
    }
    return;
  }

  switch(event.key) {
    case 'Escape':
      event.preventDefault();
      isOpen.value = false;
      break;
    case 'ArrowDown':
      event.preventDefault();
      // Implement focus next item functionality
      break;
    case 'ArrowUp':
      event.preventDefault();
      // Implement focus previous item functionality
      break;
  }
};

// Format the placeholder text based on state
const displayPlaceholder = computed(() => {
  if (loading.value) return 'Loading users...';
  if (fetchError.value || usersStore.error) return 'Failed to load users';
  if (usersStore.users?.length === 0) return 'No users available';
  return props.placeholder;
});
</script>

<template>
  <div class="user-select-component relative" ref="dropdownRef">
    <!-- Single selection display -->
    <div 
      v-if="!multiple"
      class="flex items-center justify-between cursor-pointer bg-white border rounded-md shadow-sm"
      :class="[
        sizeClass,
        isOpen ? 'border-primary-500 ring-1 ring-primary-500' : 'border-neutral-300',
        disabled ? 'bg-neutral-100 cursor-not-allowed opacity-75' : 'hover:border-primary-400',
        required && !modelValue ? 'border-red-300' : ''
      ]"
      @click="toggleDropdown"
      @keydown="handleKeyDown"
      tabindex="0"
    >
      <!-- User display -->
      <div class="flex-1 flex items-center overflow-hidden">
        <template v-if="selectedUserName">
          <span class="mdi mdi-account mr-2 text-primary-500"></span>
          <span class="truncate">{{ selectedUserName }}</span>
        </template>
        <span v-else class="text-neutral-500">{{ displayPlaceholder }}</span>
      </div>

      <!-- Clear button and dropdown icon -->
      <div class="flex items-center">
        <button 
          v-if="selectedUserName && !disabled" 
          type="button" 
          class="ml-2 text-neutral-400 hover:text-neutral-600 transition-colors" 
          @click.stop="clearSelection"
        >
          <span class="mdi mdi-close-circle text-sm"></span>
        </button>
        <span 
          class="ml-1 text-neutral-400" 
          :class="isOpen ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'"
        ></span>
      </div>
    </div>

    <!-- Multiple selection display -->
    <div 
      v-else
      class="min-h-[38px] flex flex-wrap items-center gap-2 cursor-pointer bg-white border rounded-md shadow-sm p-1.5"
      :class="[
        isOpen ? 'border-primary-500 ring-1 ring-primary-500' : 'border-neutral-300',
        disabled ? 'bg-neutral-100 cursor-not-allowed opacity-75' : 'hover:border-primary-400',
        required && (!modelValue || modelValue.length === 0) ? 'border-red-300' : ''
      ]"
      @click="toggleDropdown"
      @keydown="handleKeyDown"
      tabindex="0"
    >
      <!-- Selected users as tags with improved visualization -->
      <div 
        v-for="user in selectedUsers" 
        :key="user.id" 
        class="inline-flex items-center bg-primary-100 text-primary-800 rounded-md px-2 py-1 text-sm"
      >
        <span class="w-5 h-5 rounded-full bg-primary-200 flex items-center justify-center mr-1 flex-shrink-0">
          <span class="mdi mdi-account-outline text-primary-700"></span>
        </span>
        <span class="truncate max-w-[120px]">{{ user.name }}</span>
        <button 
          v-if="!disabled"
          @click.stop="removeUser(user.id)" 
          class="ml-1 text-primary-500 hover:text-primary-700"
        >
          <span class="mdi mdi-close-circle text-xs"></span>
        </button>
      </div>

      <!-- Placeholder when no selections -->
      <div 
        v-if="multiple && (!modelValue || modelValue.length === 0)" 
        class="text-neutral-500 pl-2"
      >
        {{ displayPlaceholder }}
      </div>

      <!-- Dropdown indicator -->
      <div class="ml-auto flex items-center">
        <span 
          v-if="selectedUsers.length > 0"
          class="mr-2 text-xs bg-primary-200 text-primary-800 rounded-full px-2 py-0.5"
        >
          {{ selectedUsers.length }}
        </span>
        <span 
          class="text-neutral-400" 
          :class="isOpen ? 'mdi mdi-chevron-up' : 'mdi mdi-chevron-down'"
        ></span>
      </div>
    </div>

    <!-- Dropdown with enhanced visuals -->
    <div 
      v-show="isOpen" 
      class="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-md shadow-lg max-h-72 overflow-auto"
    >
      <!-- Search input with clear button -->
      <div class="sticky top-0 bg-white p-2 border-b border-neutral-200 z-10">
        <div class="relative">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
            <span class="mdi mdi-magnify"></span>
          </span>
          <input
            ref="inputRef"
            v-model="searchQuery"
            class="w-full pl-10 pr-8 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
            placeholder="Search users..."
            type="text"
            @click.stop
          />
          <button 
            v-if="searchQuery" 
            @click.stop="searchQuery = ''"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600"
          >
            <span class="mdi mdi-close-circle"></span>
          </button>
        </div>
        
        <!-- Selected count for multiple select -->
        <div v-if="multiple && selectedUsers.length > 0" class="mt-2 px-1 flex justify-between items-center">
          <div class="text-xs text-neutral-600">
            <span class="font-medium">{{ selectedUsers.length }}</span> 
            {{ selectedUsers.length === 1 ? 'member' : 'members' }} selected
          </div>
          <button 
            @click.stop="clearSelection"
            class="text-xs text-primary-600 hover:text-primary-800"
          >
            Clear all
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="p-6 text-center text-neutral-500">
        <div class="animate-spin mx-auto mb-3 h-8 w-8 border-2 border-neutral-200 border-t-primary-500 rounded-full"></div>
        <p>Loading users...</p>
      </div>
      
      <!-- Error state with retry button -->
      <div v-else-if="fetchError || usersStore.error" class="p-6 text-center">
        <div class="text-red-500 mb-3">
          <span class="mdi mdi-alert-circle text-3xl block mb-2"></span>
          Failed to load users
        </div>
        <button 
          @click.stop="refreshUsers" 
          class="px-4 py-2 bg-primary-100 text-primary-700 rounded-md text-sm hover:bg-primary-200 transition-colors"
        >
          <span class="mdi mdi-refresh mr-1"></span>
          Retry
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredUsers.length === 0" class="p-6 text-center text-neutral-500">
        <span class="mdi mdi-account-search text-3xl block mb-2 opacity-50"></span>
        <template v-if="usersStore.users?.length === 0">
          No users available
        </template>
        <template v-else>
          No users match your search
        </template>
      </div>

      <!-- User list with enhanced visualization -->
      <div v-else>
        <!-- Role category divider when filter role is not specified -->
        <template v-if="!filterRole && groupByRole">
          <div v-for="roleGroup in usersByRole" :key="roleGroup.role">
            <div class="px-3 py-1 bg-neutral-50 text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {{ roleGroup.role || 'Other' }}
            </div>
            <div
              v-for="user in roleGroup.users"
              :key="user.id"
              class="px-3 py-2 cursor-pointer flex items-center hover:bg-neutral-50"
              :class="[
                isSelected(user.id) ? 'bg-primary-50' : '',
              ]"
              @click.stop="selectUser(user.id)"
            >
              <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3 flex-shrink-0">
                <span v-if="user.avatar" class="w-full h-full overflow-hidden rounded-full">
                  <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover" />
                </span>
                <span v-else class="mdi mdi-account text-primary-500"></span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm truncate">{{ user.name }}</div>
                <div class="text-xs text-neutral-500 truncate">{{ user.email }}</div>
              </div>
              <div v-if="isSelected(user.id)" class="ml-2 text-primary-500">
                <span class="mdi mdi-check-circle"></span>
              </div>
            </div>
          </div>
        </template>
        
        <!-- Regular user list when filter role is specified -->
        <div v-else>
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="px-3 py-2 cursor-pointer flex items-center hover:bg-neutral-50"
            :class="[
              isSelected(user.id) ? 'bg-primary-50' : '',
            ]"
            @click.stop="selectUser(user.id)"
          >
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3 flex-shrink-0">
              <span v-if="user.avatar" class="w-full h-full overflow-hidden rounded-full">
                <img :src="user.avatar" :alt="user.name" class="w-full h-full object-cover" />
              </span>
              <span v-else class="mdi mdi-account text-primary-500"></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm truncate">{{ user.name }}</div>
              <div class="text-xs text-neutral-500 truncate">{{ user.email }}</div>
            </div>
            <div v-if="user.role" class="ml-2 text-xs px-2 py-0.5 rounded-full bg-neutral-100">
              {{ user.role }}
            </div>
            <div v-if="isSelected(user.id)" class="ml-2 text-primary-500">
              <span class="mdi mdi-check-circle"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions footer -->
      <div v-if="multiple && filteredUsers.length > 0" class="sticky bottom-0 bg-white p-2 border-t border-neutral-200 flex justify-end space-x-2 text-xs">
        <button 
          @click.stop="selectAll" 
          class="px-3 py-1.5 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition-colors"
        >
          Select All
        </button>
        <button 
          v-if="selectedUsers.length > 0" 
          @click.stop="clearSelection" 
          class="px-3 py-1.5 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50 rounded transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar styling */
div::-webkit-scrollbar {
  width: 8px;
}

div::-webkit-scrollbar-track {
  background-color: #f1f1f1;
  border-radius: 8px;
}

div::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 8px;
}

div::-webkit-scrollbar-thumb:hover {
  background-color: #a1a1a1;
}

/* Animation */
.user-select-component {
  --transition-speed: 0.2s;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-speed) ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.user-select-component {
  width: 100%;
}
</style>