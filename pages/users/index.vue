<template>
  <div class="relative">
    <!-- Loading overlay -->
    <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-3 text-neutral-700 font-medium">Loading users...</p>
      </div>
    </div>

    <!-- Header with search and action buttons -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div class="flex flex-col w-full md:w-auto mb-4 md:mb-0">
        <h1 class="text-3xl font-bold text-neutral-900 mb-2">User Management</h1>
        <p class="text-neutral-600">Add and manage company employees</p>
      </div>
      
      <div class="flex flex-col sm:flex-row w-full md:w-auto gap-4">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="mdi mdi-magnify text-gray-400"></span>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <button 
          @click="openAddUserModal"
          class="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-300"
        >
          <span class="mdi mdi-plus text-lg mr-2"></span>
          Add New User
        </button>
      </div>
    </div>
    
    <!-- Stats Cards Row with animation -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Users -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            <span class="mdi mdi-account-group text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Total Users</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ totalUsers }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-information-outline mr-1"></span>
            All time employees
          </span>
        </div>
      </div>
      
      <!-- Developers -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center text-accent-600">
            <span class="mdi mdi-code-braces text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Developers</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ developerCount }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-chart-pie mr-1"></span>
            {{ developerPercentage }}% of workforce
          </span>
        </div>
      </div>
      
      <!-- Managers -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center text-success-600">
            <span class="mdi mdi-account-tie text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Managers</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ managerCount }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-chart-pie mr-1"></span>
            {{ managerPercentage }}% of workforce
          </span>
        </div>
      </div>
      
      <!-- Recently Added -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
            <span class="mdi mdi-account-plus text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">New Users</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ recentUsersCount }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-calendar-clock mr-1"></span>
            Last 30 days
          </span>
        </div>
      </div>
    </div>

    <!-- Users Table Section -->
    <div class="bg-white rounded-xl shadow-card mb-8 overflow-hidden">
      <div class="border-b border-neutral-200 p-5">
        <h2 class="text-xl font-semibold text-neutral-800">Employee Directory</h2>
      </div>

      <!-- Tabs Navigation -->
      <div class="border-b border-neutral-200 px-5">
        <div class="flex">
          <button 
            @click="selectedTab = 'all'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'all' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            All Users
          </button>
          <button 
            @click="selectedTab = 'developers'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'developers' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Developers
          </button>
          <button 
            @click="selectedTab = 'managers'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'managers' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Managers
          </button>
          <button 
            @click="selectedTab = 'others'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'others' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Other Roles
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Joined</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            <tr v-if="filteredUsers.length === 0 && !loading">
              <td colspan="6" class="px-6 py-10 text-center text-neutral-500">
                <div class="flex flex-col items-center">
                  <span class="mdi mdi-account-off text-5xl text-neutral-300 mb-2"></span>
                  <p class="text-lg font-medium">No users found</p>
                  <p class="text-sm mt-1">{{ searchQuery ? 'Try a different search term' : 'Add your first user to get started' }}</p>
                </div>
              </td>
            </tr>
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-neutral-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">{{ user.id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                    <span class="mdi mdi-account text-lg text-neutral-600" v-if="!user.avatar"></span>
                    <img v-else :src="user.avatar" class="h-10 w-10 rounded-full" alt="" />
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-neutral-900">{{ user.name }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{{ user.email }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  :class="[
                    'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full', 
                    getRoleBadgeClass(user.role)
                  ]"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{{ formatDate(user.createdAt) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button 
                    @click="openEditUserModal(user)" 
                    class="text-primary-600 hover:text-primary-800 transition-colors"
                    title="Edit User"
                  >
                    <span class="mdi mdi-pencil text-lg"></span>
                  </button>
                  <button 
                    @click="confirmDeleteUser(user)" 
                    class="text-red-600 hover:text-red-800 transition-colors"
                    title="Delete User"
                  >
                    <span class="mdi mdi-delete text-lg"></span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddUserModal" class="fixed inset-0 bg-black bg-opacity-25 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto" @click.stop>
        <div class="px-6 py-4 border-b border-neutral-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-neutral-900">Add New User</h3>
            <button @click="showAddUserModal = false" class="text-neutral-400 hover:text-neutral-500 focus:outline-none">
              <span class="mdi mdi-close text-xl"></span>
            </button>
          </div>
        </div>

        <form @submit.prevent="addUser" class="px-6 py-4">
          <!-- User ID field removed, will be auto-generated based on name -->
          
          <div class="mb-4">
            <label for="name" class="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
            <input
              type="text"
              id="name"
              v-model="newUser.name"
              class="input-field w-full"
              placeholder="e.g. Madhushika Bandara"
              required
            />
          </div>
          
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              v-model="newUser.email"
              class="input-field w-full"
              placeholder="e.g. mbandara@Coveragex.com"
              required
            />
          </div>
          
          <div class="mb-4">
            <label for="role" class="block text-sm font-medium text-neutral-700 mb-1">Role</label>
            <select
              id="role"
              v-model="newUser.role"
              class="input-field w-full"
              required
            >
              <option value="">Select a role</option>
              <option value="Developer">Developer</option>
              <option value="Business Analyst">Business Analyst</option>
              <option value="Project Manager">Project Manager</option>
              <option value="QA Engineer">QA Engineer</option>
              <option value="HR">HR</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          
          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              @click="showAddUserModal = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              :disabled="isSubmitting"
            >
              <span class="mdi mdi-loading mdi-spin mr-2" v-if="isSubmitting"></span>
              {{ isSubmitting ? 'Adding...' : 'Add User' }}
            </button>
          </div>

          <!-- Error message -->
          <div v-if="errorMessage" class="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>{{ errorMessage }}</p>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditUserModal" class="fixed inset-0 bg-black bg-opacity-25 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto" @click.stop>
        <div class="px-6 py-4 border-b border-neutral-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-neutral-900">Edit User</h3>
            <button @click="showEditUserModal = false" class="text-neutral-400 hover:text-neutral-500 focus:outline-none">
              <span class="mdi mdi-close text-xl"></span>
            </button>
          </div>
        </div>

        <form @submit.prevent="updateUser" class="px-6 py-4">
          <div class="mb-4">
            <label class="block text-sm font-medium text-neutral-700 mb-1">User ID</label>
            <div class="input-field-readonly w-full px-3 py-2 bg-neutral-50">{{ editingUser.id }}</div>
          </div>
          
          <div class="mb-4">
            <label for="editName" class="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
            <input
              type="text"
              id="editName"
              v-model="editingUser.name"
              class="input-field w-full"
              required
            />
          </div>
          
          <div class="mb-4">
            <label for="editEmail" class="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input
              type="email"
              id="editEmail"
              v-model="editingUser.email"
              class="input-field w-full"
              required
            />
          </div>
          
          <div class="mb-4">
            <label for="editRole" class="block text-sm font-medium text-neutral-700 mb-1">Role</label>
            <select
              id="editRole"
              v-model="editingUser.role"
              class="input-field w-full"
              required
            >
              <option value="">Select a role</option>
              <option value="Developer">Developer</option>
              <option value="Business Analyst">Business Analyst</option>
              <option value="Project Manager">Project Manager</option>
              <option value="QA Engineer">QA Engineer</option>
              <option value="HR">HR</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          
          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              @click="showEditUserModal = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              :disabled="isSubmitting"
            >
              <span class="mdi mdi-loading mdi-spin mr-2" v-if="isSubmitting"></span>
              {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>

          <!-- Error message -->
          <div v-if="errorMessage" class="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>{{ errorMessage }}</p>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-25 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full" @click.stop>
        <div class="px-6 py-4 border-b border-neutral-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium text-neutral-900">Confirm Deletion</h3>
            <button @click="showDeleteModal = false" class="text-neutral-400 hover:text-neutral-500 focus:outline-none">
              <span class="mdi mdi-close text-xl"></span>
            </button>
          </div>
        </div>

        <div class="px-6 py-4">
          <div class="mb-4">
            <p class="text-neutral-700">Are you sure you want to delete this user?</p>
            <p class="mt-2 font-medium">{{ userToDelete ? userToDelete.name : '' }}</p>
            <p class="text-sm text-neutral-500">{{ userToDelete ? userToDelete.email : '' }}</p>
          </div>
          
          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              @click="showDeleteModal = false"
            >
              Cancel
            </button>
            <button
              @click="deleteUser"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              :disabled="isSubmitting"
            >
              <span class="mdi mdi-loading mdi-spin mr-2" v-if="isSubmitting"></span>
              {{ isSubmitting ? 'Deleting...' : 'Delete User' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';

definePageMeta({
  layout: 'dashboard'
});

// Toast notifications
const toast = useToastification();

// Users data
const users = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedTab = ref('all');

// Modal states
const showAddUserModal = ref(false);
const showEditUserModal = ref(false);
const showDeleteModal = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

// User form data
const newUser = ref({
  id: '',
  name: '',
  email: '',
  role: ''
});

// Edit user data
const editingUser = ref({
  id: '',
  name: '',
  email: '',
  role: ''
});

// User to delete
const userToDelete = ref(null);

// Watch for name changes to auto-generate ID
watch(() => newUser.value.name, (newName) => {
  if (newName) {
    newUser.value.id = generateUserId(newName);
  }
});

// Generate user ID based on name (initials followed by a number)
const generateUserId = (fullName) => {
  if (!fullName) return '';
  
  // Extract initials from the name
  const nameParts = fullName.trim().split(/\s+/);
  let initials = nameParts.map(part => part.charAt(0).toLowerCase()).join('');
  
  // Ensure we have at least two characters for initials
  if (initials.length < 2 && nameParts[0]) {
    // If only one name, use the first two letters
    initials = nameParts[0].substring(0, 2).toLowerCase();
  }
  
  // Find the highest existing ID with these initials
  const regex = new RegExp(`^${initials}(\\d+)$`, 'i');
  const existingIds = users.value
    .map(user => user.id)
    .filter(id => regex.test(id))
    .map(id => {
      const match = id.match(regex);
      return match ? parseInt(match[1]) : 0;
    });
  
  // Get the next available number
  const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  
  // Format the number with leading zeros (e.g., 001, 002, etc.)
  const paddedNumber = nextNumber.toString().padStart(3, '0');
  
  return `${initials}${paddedNumber}`;
};

// Computed properties for stats
const totalUsers = computed(() => users.value.length);

const developerCount = computed(() => 
  users.value.filter(user => user.role === 'Developer').length
);

const managerCount = computed(() => 
  users.value.filter(user => user.role === 'Manager' || user.role === 'Project Manager').length
);

const developerPercentage = computed(() => {
  if (totalUsers.value === 0) return 0;
  return Math.round((developerCount.value / totalUsers.value) * 100);
});

const managerPercentage = computed(() => {
  if (totalUsers.value === 0) return 0;
  return Math.round((managerCount.value / totalUsers.value) * 100);
});

// Calculate users added in the last 30 days
const recentUsersCount = computed(() => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return users.value.filter(user => {
    if (!user.createdAt) return false;
    const createdAt = new Date(user.createdAt);
    return createdAt >= thirtyDaysAgo;
  }).length;
});

// Filtered users based on tab and search
const filteredUsers = computed(() => {
  let filtered = users.value;
  
  // Filter by tab selection
  if (selectedTab.value === 'developers') {
    filtered = filtered.filter(user => user.role === 'Developer');
  } else if (selectedTab.value === 'managers') {
    filtered = filtered.filter(user => ['Manager', 'Project Manager'].includes(user.role));
  } else if (selectedTab.value === 'others') {
    filtered = filtered.filter(user => !['Developer', 'Manager', 'Project Manager'].includes(user.role));
  }
  
  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query) || 
      user.id.toLowerCase().includes(query) || 
      user.role.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get role badge class
const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'Developer':
      return 'bg-accent-100 text-accent-700';
    case 'Project Manager':
    case 'Manager':
      return 'bg-success-100 text-success-800';
    case 'Admin':
      return 'bg-warning-100 text-warning-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
};

// Open add user modal
const openAddUserModal = () => {
  // Reset form and error
  newUser.value = {
    id: '',
    name: '',
    email: '',
    role: ''
  };
  errorMessage.value = '';
  showAddUserModal.value = true;
};

// Open edit user modal
const openEditUserModal = (user) => {
  // Clone user to prevent direct object reference
  editingUser.value = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    _id: user._id
  };
  
  errorMessage.value = '';
  showEditUserModal.value = true;
};

// Confirm delete user
const confirmDeleteUser = (user) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

// Add new user
const addUser = async () => {
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    
    // Ensure the ID is generated if not already set
    if (!newUser.value.id && newUser.value.name) {
      newUser.value.id = generateUserId(newUser.value.name);
    }
    
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newUser.value)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add user');
    }
    
    // Add the new user to the list
    users.value.push(data.user);
    
    // Close modal and show success message
    showAddUserModal.value = false;
    toast.success('User added successfully');
    
    // Refresh user list
    fetchUsers();
    
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error adding user:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// Update existing user
const updateUser = async () => {
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    
    const response = await fetch(`/api/users/${editingUser.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editingUser.value)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update user');
    }
    
    // Update user in the list
    const index = users.value.findIndex(u => u.id === editingUser.value.id);
    if (index !== -1) {
      users.value[index] = data;
    }
    
    // Close modal and show success message
    showEditUserModal.value = false;
    toast.success('User updated successfully');
    
  } catch (error) {
    errorMessage.value = error.message;
    console.error('Error updating user:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// Delete user
const deleteUser = async () => {
  if (!userToDelete.value) return;
  
  try {
    isSubmitting.value = true;
    
    const response = await fetch(`/api/users/${userToDelete.value.id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete user');
    }
    
    // Remove user from the list
    users.value = users.value.filter(u => u.id !== userToDelete.value.id);
    
    // Close modal and show success message
    showDeleteModal.value = false;
    toast.success('User deleted successfully');
    
  } catch (error) {
    toast.error(error.message || 'An error occurred while deleting the user');
    console.error('Error deleting user:', error);
  } finally {
    isSubmitting.value = false;
    userToDelete.value = null;
  }
};

// Fetch all users
const fetchUsers = async () => {
  try {
    loading.value = true;
    const response = await fetch('/api/users');
    const data = await response.json();
    
    if (response.ok) {
      users.value = data.users || [];
    } else {
      toast.error('Failed to load users');
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Failed to load users');
  } finally {
    loading.value = false;
  }
};

// Create a composable for toast notifications to work with vue-toastification
function useToastification() {
  const { $toast } = useNuxtApp();
  
  return {
    success: (message) => $toast.success(message),
    error: (message) => $toast.error(message),
    info: (message) => $toast.info(message),
    warning: (message) => $toast.warning(message)
  };
}

// Load users when component is mounted
onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.shadow-card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
}

.input-field {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.input-field::placeholder {
  color: #9ca3af;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

.input-field-readonly {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #f3f4f6;
  color: #374151;
}

/* Animation for hover effects */
.transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

.hover\:-translate-y-1:hover {
  --tw-translate-y: -0.25rem;
  transform: var(--tw-transform);
}
</style>