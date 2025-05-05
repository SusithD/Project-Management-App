<template>
  <div>
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-semibold text-gray-800">Employee Directory</h1>
        
        <div class="flex space-x-2">
          <div class="relative">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search employees..."
              class="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div class="absolute right-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <select 
            v-model="roleFilter" 
            class="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
          </select>

          <select 
            v-model="departmentFilter" 
            class="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="product">Product</option>
            <option value="operations">Operations</option>
          </select>
        </div>
      </div>
      
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
      
      <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{{ error }}</p>
      </div>
      
      <div v-else>
        <!-- Employee Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="employee in filteredEmployees" 
            :key="employee.id"
            class="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <div v-if="employee.avatar" class="h-12 w-12 rounded-full overflow-hidden">
                  <img :src="employee.avatar" :alt="employee.name" class="h-full w-full object-cover" />
                </div>
                <div v-else class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                  {{ getInitials(employee.name) }}
                </div>
              </div>
              
              <div class="flex-1 min-w-0">
                <p class="text-lg font-medium text-gray-900 truncate">{{ employee.name }}</p>
                <p class="text-sm text-gray-500 truncate">{{ employee.email }}</p>
                <div class="flex items-center mt-1 space-x-2">
                  <span class="px-2 py-0.5 text-xs rounded-full" 
                        :class="getRoleBadgeClass(employee.role)">
                    {{ formatRole(employee.role) }}
                  </span>
                  <span v-if="employee.department" class="px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">
                    {{ employee.department }}
                  </span>
                </div>
              </div>
              
              <div>
                <button 
                  @click="viewEmployeeDetails(employee.id)"
                  class="text-blue-600 hover:text-blue-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="filteredEmployees.length === 0" class="py-10 text-center text-gray-500">
          No employees match your search criteria.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUsersStore } from '~/stores/users';

definePageMeta({
  layout: 'dashboard',
});

// Users store
const usersStore = useUsersStore();

// Local state
const loading = ref(false);
const error = ref(null);
const searchQuery = ref('');
const roleFilter = ref('');
const departmentFilter = ref('');

// Fetch users when component mounts
onMounted(async () => {
  loading.value = true;
  try {
    await usersStore.fetchUsers();
  } catch (err) {
    error.value = 'Failed to load employees. Please try again later.';
    console.error('Error fetching employees:', err);
  } finally {
    loading.value = false;
  }
});

// Computed properties
const filteredEmployees = computed(() => {
  const query = searchQuery.value.toLowerCase();
  
  return usersStore.users.filter(employee => {
    // Filter by search query
    const matchesQuery = !query || 
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      (employee.role && employee.role.toLowerCase().includes(query));
    
    // Filter by role if selected
    const matchesRole = !roleFilter.value || employee.role === roleFilter.value;
    
    // Filter by department if selected
    const matchesDepartment = !departmentFilter.value || 
      (employee.department && employee.department === departmentFilter.value);
    
    return matchesQuery && matchesRole && matchesDepartment;
  });
});

// Helper functions
const getInitials = (name) => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

const formatRole = (role) => {
  if (!role) return 'N/A';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800';
    case 'developer':
      return 'bg-green-100 text-green-800';
    case 'designer':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const viewEmployeeDetails = (employeeId) => {
  navigateTo(`/employees/${employeeId}`);
};
</script>