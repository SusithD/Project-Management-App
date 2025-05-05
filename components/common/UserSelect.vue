<script setup>
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { useUsersStore } from '~/stores/users';

const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: () => ''
  },
  label: {
    type: String,
    default: 'User'
  },
  placeholder: {
    type: String,
    default: 'Select user'
  },
  required: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  },
  filterRole: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

// Initialize users store
const usersStore = useUsersStore();

// Component state
const isOpen = ref(false);
const searchQuery = ref('');
const selectedUsers = ref(props.multiple ? [...(Array.isArray(props.modelValue) ? props.modelValue : [])] : props.modelValue);

// Ensure users are loaded when the component is mounted
onMounted(async () => {
  if (usersStore.users.length === 0) {
    try {
      await usersStore.fetchUsers();
      console.log('UserSelect: Successfully loaded users:', usersStore.users.length);
    } catch (error) {
      console.error('UserSelect: Error loading users:', error);
    }
  } else {
    console.log('UserSelect: Already have users loaded:', usersStore.users.length);
  }
});

// Filtered users based on search query and role filter
const filteredUsers = computed(() => {
  let users = usersStore.users;
  
  // Filter by role if provided
  if (props.filterRole) {
    users = users.filter(user => user.role === props.filterRole);
  }
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    users = users.filter(user => 
      user.name?.toLowerCase().includes(query) || 
      user.email?.toLowerCase().includes(query)
    );
  }
  
  return users;
});

// Helper to determine if a user is selected (in multiple mode)
const isUserSelected = (userId) => {
  if (props.multiple) {
    return selectedUsers.value.includes(userId);
  }
  return selectedUsers.value === userId;
};

// Toggle user selection
const toggleUser = (userId) => {
  if (props.multiple) {
    if (isUserSelected(userId)) {
      selectedUsers.value = selectedUsers.value.filter(id => id !== userId);
    } else {
      selectedUsers.value = [...selectedUsers.value, userId];
    }
  } else {
    selectedUsers.value = userId;
    isOpen.value = false; // Close dropdown after selection in single mode
  }
  
  emit('update:modelValue', selectedUsers.value);
};

// Clear selection
const clearSelection = () => {
  selectedUsers.value = props.multiple ? [] : '';
  emit('update:modelValue', selectedUsers.value);
};

// Close dropdown when clicking outside
const dropdownRef = ref(null);
const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (props.multiple) {
    selectedUsers.value = Array.isArray(newValue) ? [...newValue] : [];
  } else {
    selectedUsers.value = newValue;
  }
}, { deep: true });

// Enhanced positioning logic for dropdown
const dropdownPosition = ref('bottom');
const dropdownWidth = ref(0);
const dropdownLeft = ref(0);

// Enhanced dropdown visibility
const useFixedPosition = ref(false);
const dropdownTop = ref(0);
const windowHeight = ref(0);

const calculateDropdownPosition = () => {
  if (!dropdownRef.value) return;
  
  const rect = dropdownRef.value.getBoundingClientRect();
  windowHeight.value = window.innerHeight;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const dropdownHeight = 320; // Approximate max height of dropdown
  
  // Save width and position for absolute positioning
  dropdownWidth.value = rect.width;
  dropdownLeft.value = rect.left;
  dropdownTop.value = rect.bottom;
  
  // Determine if we need to use fixed positioning to break out of containers
  const needsFixedPosition = spaceBelow < dropdownHeight && document.body.scrollHeight > window.innerHeight;
  useFixedPosition.value = needsFixedPosition;
  
  // If there's not enough space below and more space above, position above
  if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
    dropdownPosition.value = 'top';
  } else {
    dropdownPosition.value = 'bottom';
  }
};

// Update position when opening dropdown
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  
  if (isOpen.value) {
    calculateDropdownPosition();
    // Force repositioning after DOM update
    setTimeout(calculateDropdownPosition, 10);
  }
};

// Listen for window resize to recalculate position if dropdown is open
const handleResize = () => {
  if (isOpen.value) {
    calculateDropdownPosition();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleResize, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleResize, true);
});

// Get selected user display names for display
const selectedUserNames = computed(() => {
  if (props.multiple) {
    return selectedUsers.value.map(id => usersStore.getUserDisplayName(id)).join(', ');
  }
  return usersStore.getUserDisplayName(selectedUsers.value);
});

// Check if there are users available
const hasUsers = computed(() => {
  return usersStore.users && usersStore.users.length > 0;
});

// Loading state
const isLoading = computed(() => usersStore.loading);
</script>

<template>
  <div ref="dropdownRef" class="relative w-full">
    <!-- Display field -->
    <div 
      @click="toggleDropdown" 
      :class="[
        'flex items-center justify-between w-full border rounded-md px-4 py-2.5 cursor-pointer transition-all duration-200',
        isOpen ? 'border-primary-500 ring-2 ring-primary-200' : 'border-neutral-300 hover:border-neutral-400',
        required ? 'required-field' : ''
      ]"
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <span class="mdi mdi-account-circle text-primary-500"></span>
        <span v-if="selectedUsers && ((!multiple && selectedUsers) || (multiple && selectedUsers.length > 0))" class="truncate">
          {{ selectedUserNames }}
        </span>
        <span v-else class="text-neutral-500 truncate">{{ placeholder }}</span>
      </div>
      <div class="flex items-center">
        <button 
          v-if="selectedUsers && ((!multiple && selectedUsers) || (multiple && selectedUsers.length > 0))"
          type="button" 
          @click.stop="clearSelection" 
          class="text-neutral-400 hover:text-neutral-600 mr-2"
        >
          <span class="mdi mdi-close-circle text-lg"></span>
        </button>
        <span class="mdi text-neutral-400" :class="isOpen ? 'mdi-chevron-up' : 'mdi-chevron-down'"></span>
      </div>
    </div>
    
    <!-- Dropdown menu with fixed position option -->
    <div 
      v-show="isOpen" 
      :style="{
        width: `${dropdownWidth}px`,
        left: useFixedPosition ? `${dropdownLeft}px` : '0',
        top: useFixedPosition && dropdownPosition === 'bottom' ? `${dropdownTop}px` : 'auto',
        bottom: useFixedPosition && dropdownPosition === 'top' ? `${windowHeight - dropdownTop + 5}px` : 'auto',
        position: useFixedPosition ? 'fixed' : 'absolute',
        zIndex: 99999
      }"
      :class="[
        'ultra-dropdown bg-white border border-neutral-200 rounded-md shadow-xl overflow-hidden',
        !useFixedPosition && (dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'),
        'dropdown-container'
      ]"
    >
      <!-- Search input -->
      <div class="sticky top-0 bg-white border-b border-neutral-100 p-2 z-10">
        <div class="relative">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search users..." 
            class="block w-full rounded-md border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            @click.stop
          />
          <span class="absolute left-3 top-2 text-neutral-400 mdi mdi-magnify"></span>
        </div>
      </div>

      <!-- User list container with fixed height -->
      <div class="dropdown-content">
        <!-- Loading state -->
        <div v-if="isLoading" class="flex justify-center items-center p-4 h-24">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        </div>
        
        <!-- No users message -->
        <div v-else-if="!hasUsers" class="p-4 text-center text-neutral-500 h-24 flex items-center justify-center">
          No users available
        </div>

        <!-- No results message -->
        <div v-else-if="filteredUsers.length === 0" class="p-4 text-center text-neutral-500 h-24 flex items-center justify-center">
          No users match your search
        </div>
        
        <!-- User list with improved visibility -->
        <div v-else class="py-1">
          <button
            v-for="user in filteredUsers" 
            :key="user.id"
            type="button"
            @click.stop="toggleUser(user.id)"
            class="flex items-center justify-between w-full px-4 py-2.5 text-sm text-left hover:bg-neutral-100"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 flex-shrink-0 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                <span class="mdi mdi-account text-lg"></span>
              </div>
              <div class="overflow-hidden">
                <p class="font-medium text-neutral-800 truncate">{{ user.name }}</p>
                <p class="text-xs text-neutral-500 truncate">{{ user.role }}</p>
              </div>
            </div>
            <span 
              v-if="isUserSelected(user.id)"
              class="mdi mdi-check text-primary-600 text-lg flex-shrink-0 ml-2"
            ></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.required-field::after {
  content: '*';
  color: #ef4444;
  margin-left: 0.25rem;
}

/* Even higher z-index and improved positioning */
.ultra-dropdown {
  z-index: 99999 !important; /* Maximum z-index */
  box-shadow: rgba(0, 0, 0, 0.2) 0px 20px 30px, rgba(0, 0, 0, 0.1) 0px 10px 10px !important;
}

.dropdown-container {
  max-height: 320px;
  display: flex;
  flex-direction: column;
}

.dropdown-content {
  overflow-y: auto;
  min-height: 120px;
  max-height: 280px;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
  position: relative;
}

/* Custom scrollbar for webkit browsers */
.dropdown-content::-webkit-scrollbar {
  width: 6px;
}

.dropdown-content::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-content::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 3px;
}

/* Prevent container from overflowing the viewport */
@media screen and (max-height: 600px) {
  .dropdown-content {
    max-height: 200px;
  }
}

@media screen and (max-height: 500px) {
  .dropdown-content {
    max-height: 160px;
  }
}
</style>
