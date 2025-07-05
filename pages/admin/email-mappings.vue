<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Email Role Mappings</h1>
        <p class="text-gray-600 mt-1">Manage automatic role assignments based on email addresses</p>
      </div>
      <div class="flex space-x-3">
        <button 
          @click="refreshMappings"
          :disabled="loading"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <span class="mdi mdi-refresh mr-2" :class="{ 'animate-spin': loading }"></span>
          Refresh
        </button>
        <button 
          @click="showCreateModal = true"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <span class="mdi mdi-plus mr-2"></span>
          Add Mapping
        </button>
      </div>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Mappings</p>
            <p class="text-2xl font-bold text-gray-900">{{ mappings.length }}</p>
          </div>
          <div class="w-3 h-3 rounded-full bg-blue-400"></div>
        </div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Super Admins</p>
            <p class="text-2xl font-bold text-gray-900">{{ getRoleCount('SUPER_ADMIN') }}</p>
          </div>
          <div class="w-3 h-3 rounded-full bg-red-400"></div>
        </div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Managers</p>
            <p class="text-2xl font-bold text-gray-900">{{ getRoleCount('MANAGER') }}</p>
          </div>
          <div class="w-3 h-3 rounded-full bg-purple-400"></div>
        </div>
      </div>
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Other Roles</p>
            <p class="text-2xl font-bold text-gray-900">{{ mappings.length - getRoleCount('SUPER_ADMIN') - getRoleCount('MANAGER') }}</p>
          </div>
          <div class="w-3 h-3 rounded-full bg-gray-400"></div>
        </div>
      </div>
    </div>

    <!-- Mappings Table -->
    <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900">Email Role Mappings</h2>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <span class="mdi mdi-magnify text-lg"></span>
            </span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search emails..." 
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email Address
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Modified
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="mapping in filteredMappings" :key="mapping.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                    <span class="mdi mdi-email text-gray-600"></span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ mapping.email }}</div>
                    <div v-if="mapping.email === authStore.userEmail?.toLowerCase()" class="text-xs text-blue-600">
                      (Your email)
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <RoleBadge :role="mapping.role" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>{{ formatDate(mapping.createdAt) }}</div>
                <div class="text-xs text-gray-400">by {{ mapping.createdBy }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div v-if="mapping.lastModified">{{ formatDate(mapping.lastModified) }}</div>
                <div v-if="mapping.lastModifiedBy" class="text-xs text-gray-400">by {{ mapping.lastModifiedBy }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button 
                    @click="editMapping(mapping)"
                    class="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-primary-50"
                    title="Edit Mapping"
                  >
                    <span class="mdi mdi-pencil"></span>
                  </button>
                  <button 
                    v-if="mapping.email !== authStore.userEmail?.toLowerCase()"
                    @click="confirmDelete(mapping)"
                    class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                    title="Delete Mapping"
                  >
                    <span class="mdi mdi-delete"></span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredMappings.length === 0 && !loading" class="text-center py-12">
        <span class="mdi mdi-email-search text-4xl text-gray-400"></span>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No mappings found</h3>
        <p class="mt-1 text-sm text-gray-500">Try adjusting your search or create a new mapping.</p>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-medium text-gray-900">
            {{ showEditModal ? 'Edit Email Mapping' : 'Add Email Mapping' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <span class="mdi mdi-close text-xl"></span>
          </button>
        </div>
        
        <form @submit.prevent="saveMapping" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div class="relative">
              <input 
                v-model="formData.email"
                @input="onEmailInput"
                @focus="showEmailDropdown = true"
                @blur="onEmailBlur"
                type="email" 
                required
                placeholder="Select from employees or type new email..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
              
              <!-- Email Suggestions Dropdown -->
              <div 
                v-if="showEmailDropdown && filteredEmployees.length > 0" 
                class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
              >
                <div class="p-2 border-b border-gray-200 text-xs text-gray-500 font-medium">
                  Select from existing employees:
                </div>
                <button
                  v-for="employee in filteredEmployees"
                  :key="employee.id"
                  type="button"
                  @mousedown.prevent="selectEmployee(employee)"
                  class="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ employee.name }}</div>
                    <div class="text-xs text-gray-600">{{ employee.email }}</div>
                  </div>
                  <div class="text-xs text-gray-500">{{ employee.role }}</div>
                </button>
                <div v-if="filteredEmployees.length === 0 && allEmployees.length > 0" class="p-3 text-center text-gray-500 text-sm">
                  No employees found matching "{{ formData.email }}"
                </div>
              </div>
            </div>
            <div class="mt-1 text-xs text-gray-500">
              Start typing to search existing employees, or enter a new email address
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Assigned Role
            </label>
            <select 
              v-model="formData.role" 
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a role...</option>
              <option 
                v-for="role in availableRoles" 
                :key="role.key" 
                :value="role.key"
              >
                {{ role.name }} (Level {{ role.hierarchy }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea 
              v-model="formData.reason"
              rows="3"
              placeholder="Reason for this mapping..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button 
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <span v-if="saving" class="mdi mdi-loading mdi-spin mr-2"></span>
              {{ saving ? 'Saving...' : (showEditModal ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-medium text-gray-900">Confirm Deletion</h3>
          <button @click="showDeleteModal = false" class="text-gray-400 hover:text-gray-600">
            <span class="mdi mdi-close text-xl"></span>
          </button>
        </div>
        
        <div class="mb-6">
          <p class="text-gray-700">
            Are you sure you want to delete the email mapping for:
          </p>
          <p class="font-medium text-gray-900 mt-2">{{ mappingToDelete?.email }}</p>
          <p class="text-sm text-gray-600 mt-1">
            This will remove the automatic role assignment for this email address.
          </p>
        </div>

        <div class="flex justify-end space-x-3">
          <button 
            @click="showDeleteModal = false"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            @click="deleteMapping"
            :disabled="saving"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <span v-if="saving" class="mdi mdi-loading mdi-spin mr-2"></span>
            {{ saving ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';

// Define layout
definePageMeta({
  layout: 'dashboard'
});

// Auth store
const authStore = useAuthStore();

// Data
const mappings = ref([]);
const availableRoles = ref([]);
const allEmployees = ref([]);
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const showEmailDropdown = ref(false);

// Modal states
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);

// Form data
const formData = ref({
  id: null,
  email: '',
  role: '',
  reason: ''
});

const mappingToDelete = ref(null);

// Computed
const filteredMappings = computed(() => {
  if (!searchQuery.value) return mappings.value;
  
  const query = searchQuery.value.toLowerCase();
  return mappings.value.filter(mapping => 
    mapping.email.toLowerCase().includes(query) ||
    mapping.roleName.toLowerCase().includes(query)
  );
});

// Filter employees based on email input
const filteredEmployees = computed(() => {
  if (!formData.value.email) return allEmployees.value.slice(0, 10); // Show first 10 if no input
  
  const query = formData.value.email.toLowerCase();
  const filtered = allEmployees.value.filter(employee => 
    employee.email.toLowerCase().includes(query) ||
    employee.name.toLowerCase().includes(query)
  );
  
  // Don't show employees that already have mappings
  const existingEmails = new Set(mappings.value.map(m => m.email.toLowerCase()));
  return filtered.filter(employee => !existingEmails.has(employee.email.toLowerCase()));
});

// Methods
const refreshMappings = async () => {
  loading.value = true;
  try {
    const response = await $fetch('/api/admin/email-role-mappings', {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      }
    });
    mappings.value = response.mappings || [];
    availableRoles.value = response.availableRoles || [];
  } catch (error) {
    console.error('Error fetching mappings:', error);
  } finally {
    loading.value = false;
  }
};

const fetchEmployees = async () => {
  try {
    const response = await $fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      }
    });
    allEmployees.value = response.users || [];
  } catch (error) {
    console.error('Error fetching employees:', error);
  }
};

const getRoleCount = (roleKey) => {
  return mappings.value.filter(mapping => mapping.role === roleKey).length;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const selectEmployee = (employee) => {
  formData.value.email = employee.email;
  showEmailDropdown.value = false;
};

const onEmailInput = () => {
  showEmailDropdown.value = true;
};

const onEmailBlur = () => {
  // Delay hiding dropdown to allow for click events
  setTimeout(() => {
    showEmailDropdown.value = false;
  }, 200);
};

const editMapping = (mapping) => {
  formData.value = {
    id: mapping.id,
    email: mapping.email,
    role: mapping.role,
    reason: ''
  };
  showEditModal.value = true;
};

const confirmDelete = (mapping) => {
  mappingToDelete.value = mapping;
  showDeleteModal.value = true;
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  showEmailDropdown.value = false;
  formData.value = {
    id: null,
    email: '',
    role: '',
    reason: ''
  };
};

const saveMapping = async () => {
  saving.value = true;
  try {
    if (showEditModal.value) {
      // Update existing mapping
      const response = await $fetch('/api/admin/email-role-mappings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authStore.accessToken}`
        },
        body: formData.value
      });
      
      // Update local data
      const index = mappings.value.findIndex(m => m.id === formData.value.id);
      if (index !== -1) {
        mappings.value[index] = { ...mappings.value[index], ...response.mapping };
      }
    } else {
      // Create new mapping
      const response = await $fetch('/api/admin/email-role-mappings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authStore.accessToken}`
        },
        body: formData.value
      });
      
      // Add to local data
      mappings.value.push(response.mapping);
    }
    
    closeModal();
  } catch (error) {
    console.error('Error saving mapping:', error);
  } finally {
    saving.value = false;
  }
};

const deleteMapping = async () => {
  if (!mappingToDelete.value) return;
  
  saving.value = true;
  try {
    await $fetch('/api/admin/email-role-mappings', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      },
      query: { email: mappingToDelete.value.email }
    });
    
    // Remove from local data
    mappings.value = mappings.value.filter(m => m.id !== mappingToDelete.value.id);
    
    showDeleteModal.value = false;
    mappingToDelete.value = null;
  } catch (error) {
    console.error('Error deleting mapping:', error);
  } finally {
    saving.value = false;
  }
};

// Load mappings and employees on component mount
onMounted(async () => {
  // Check if user is authenticated before trying to fetch data
  if (!authStore.isAuthenticated || !authStore.isSessionValid) {
    console.log('User not authenticated, skipping email mappings fetch');
    return;
  }
  
  // Check if user has the required permissions
  if (!authStore.isSuperAdmin) {
    console.log('User is not a Super Admin, cannot access email mappings');
    // You might want to redirect or show an error message here
    return;
  }
  
  try {
    await Promise.all([
      refreshMappings(),
      fetchEmployees()
    ]);
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
});

// Watch for authentication changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated && authStore.isSuperAdmin) {
    // User just authenticated and is a Super Admin, load data
    Promise.all([
      refreshMappings(),
      fetchEmployees()
    ]).catch(error => {
      console.error('Error loading data after authentication:', error);
    });
  }
});
</script>