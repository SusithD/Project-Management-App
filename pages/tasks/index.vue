<template>
  <div class="relative">
    <!-- Loading overlay -->
    <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-3 text-neutral-700 font-medium">Loading tasks...</p>
      </div>
    </div>

    <!-- Header with search and action buttons -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div class="flex flex-col w-full md:w-auto mb-4 md:mb-0">
        <h1 class="text-3xl font-bold text-neutral-900 mb-2">My Tasks</h1>
        <p class="text-neutral-600">View and manage your assigned tasks</p>
      </div>
      
      <div class="flex flex-col sm:flex-row w-full md:w-auto gap-4">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="mdi mdi-magnify text-gray-400"></span>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tasks..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <button 
          class="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-300"
        >
          <span class="mdi mdi-filter-variant text-lg mr-2"></span>
          Filter
        </button>
      </div>
    </div>

    <!-- Stats Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Tasks -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            <span class="mdi mdi-checkbox-marked-outline text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Total Tasks</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ totalTasks }}</p>
      </div>
      
      <!-- In Progress -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center text-accent-600">
            <span class="mdi mdi-clock-outline text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">In Progress</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ inProgressTasks }}</p>
      </div>
      
      <!-- Completed -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center text-success-600">
            <span class="mdi mdi-check-circle-outline text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Completed</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ completedTasks }}</p>
      </div>
      
      <!-- Overdue -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
            <span class="mdi mdi-alert-circle-outline text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Overdue</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ overdueTasks }}</p>
      </div>
    </div>

    <!-- Tasks List Section -->
    <div class="bg-white rounded-xl shadow-card mb-8">
      <div class="border-b border-neutral-200 p-5">
        <h2 class="text-xl font-semibold text-neutral-800">Task List</h2>
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
            All Tasks
          </button>
          <button 
            @click="selectedTab = 'active'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'active' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Active
          </button>
          <button 
            @click="selectedTab = 'completed'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'completed' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Completed
          </button>
          <button 
            @click="selectedTab = 'overdue'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'overdue' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Overdue
          </button>
        </div>
      </div>

      <!-- Tasks Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Task</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Project</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Due Date</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Priority</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            <tr v-if="filteredTasks.length === 0 && !loading">
              <td colspan="6" class="px-6 py-10 text-center text-neutral-500">
                <div class="flex flex-col items-center">
                  <span class="mdi mdi-clipboard-text-outline text-5xl text-neutral-300 mb-2"></span>
                  <p class="text-lg font-medium">No tasks found</p>
                  <p class="text-sm mt-1">{{ searchQuery ? 'Try a different search term' : 'You have no tasks assigned currently' }}</p>
                </div>
              </td>
            </tr>
            <tr v-for="task in filteredTasks" :key="task.id" class="hover:bg-neutral-50">
              <td class="px-6 py-4">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <input 
                      type="checkbox" 
                      :checked="task.status === 'Completed'"
                      @change="toggleTaskStatus(task)"
                      class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>
                  <div class="ml-3">
                    <div :class="[
                      'text-sm font-medium',
                      task.status === 'Completed' ? 'text-neutral-500 line-through' : 'text-neutral-900'
                    ]">
                      {{ task.title }}
                    </div>
                    <div class="text-sm text-neutral-500 mt-1">{{ task.description }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-neutral-900">{{ task.project }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div :class="[
                  'text-sm',
                  isOverdue(task) ? 'text-red-600 font-medium' : 'text-neutral-900'
                ]">
                  {{ formatDate(task.dueDate) }}
                  <span v-if="isOverdue(task)" class="text-xs font-medium ml-1 text-red-600">
                    (Overdue)
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  :class="[
                    'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full', 
                    getStatusBadgeClass(task.status)
                  ]"
                >
                  {{ task.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  :class="[
                    'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full', 
                    getPriorityBadgeClass(task.priority)
                  ]"
                >
                  {{ task.priority }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                  <button 
                    @click="viewTaskDetails(task)" 
                    class="text-primary-600 hover:text-primary-800 transition-colors"
                    title="View Details"
                  >
                    <span class="mdi mdi-eye text-lg"></span>
                  </button>
                  <button 
                    class="text-neutral-600 hover:text-neutral-800 transition-colors"
                    title="Edit Task"
                  >
                    <span class="mdi mdi-pencil text-lg"></span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty list placeholder - shown when there are no tasks -->
      <div v-if="!loading && tasks.length === 0" class="py-12 px-6 text-center">
        <div class="flex flex-col items-center">
          <div class="mb-4 bg-neutral-100 rounded-full p-6 w-20 h-20 flex items-center justify-center">
            <span class="mdi mdi-clipboard-check-outline text-4xl text-neutral-500"></span>
          </div>
          <h3 class="text-lg font-medium text-neutral-900 mb-1">No tasks yet</h3>
          <p class="text-neutral-500 max-w-sm mx-auto">
            You don't have any tasks assigned to you yet. Tasks will appear here when they are assigned.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

definePageMeta({
  layout: 'dashboard'
});

// Toast notifications
function useToastification() {
  const { $toast } = useNuxtApp();
  
  return {
    success: (message) => $toast.success(message),
    error: (message) => $toast.error(message),
    info: (message) => $toast.info(message),
    warning: (message) => $toast.warning(message)
  };
}

const toast = useToastification();

// Tasks data
const tasks = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedTab = ref('all');

// Example tasks data - replace with API call in production
onMounted(() => {
  // Simulating API call delay
  setTimeout(() => {
    tasks.value = [
      {
        id: 1,
        title: 'Update project documentation',
        description: 'Review and update project documentation for Phase 2',
        project: 'CoverageX Portal',
        status: 'In Progress',
        priority: 'Medium',
        dueDate: '2025-05-10',
        createdAt: '2025-04-28'
      },
      {
        id: 2,
        title: 'Fix login page bug',
        description: 'Address the authentication issue on the login page',
        project: 'Admin Dashboard',
        status: 'To Do',
        priority: 'High',
        dueDate: '2025-05-05',
        createdAt: '2025-05-01'
      },
      {
        id: 3,
        title: 'Implement user feedback form',
        description: 'Add a feedback form to the user dashboard',
        project: 'Customer Portal',
        status: 'Completed',
        priority: 'Low',
        dueDate: '2025-05-04',
        createdAt: '2025-04-25'
      },
      {
        id: 4,
        title: 'API integration with payment gateway',
        description: 'Integrate the payment API with our checkout flow',
        project: 'E-commerce Module',
        status: 'In Progress',
        priority: 'High',
        dueDate: '2025-05-15',
        createdAt: '2025-04-30'
      },
      {
        id: 5,
        title: 'Prepare user training materials',
        description: 'Create training guides for new system features',
        project: 'CoverageX Portal',
        status: 'To Do',
        priority: 'Medium',
        dueDate: '2025-05-20',
        createdAt: '2025-05-02'
      }
    ];
    loading.value = false;
  }, 1500);
});

// Computed properties for filtering tasks
const filteredTasks = computed(() => {
  let filtered = [...tasks.value];
  
  // Filter by tab
  if (selectedTab.value === 'active') {
    filtered = filtered.filter(task => task.status !== 'Completed');
  } else if (selectedTab.value === 'completed') {
    filtered = filtered.filter(task => task.status === 'Completed');
  } else if (selectedTab.value === 'overdue') {
    filtered = filtered.filter(task => isOverdue(task) && task.status !== 'Completed');
  }
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      task.project.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

// Task statistics
const totalTasks = computed(() => tasks.value.length);
const completedTasks = computed(() => tasks.value.filter(task => task.status === 'Completed').length);
const inProgressTasks = computed(() => tasks.value.filter(task => task.status === 'In Progress').length);
const overdueTasks = computed(() => tasks.value.filter(task => isOverdue(task) && task.status !== 'Completed').length);

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const isOverdue = (task) => {
  if (task.status === 'Completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  const dueDate = new Date(task.dueDate);
  return dueDate < today;
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-success-100 text-success-800';
    case 'In Progress':
      return 'bg-accent-100 text-accent-700';
    case 'To Do':
      return 'bg-neutral-100 text-neutral-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
};

const getPriorityBadgeClass = (priority) => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'Low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
};

// Task actions
const toggleTaskStatus = (task) => {
  if (task.status === 'Completed') {
    task.status = 'In Progress';
    toast.info(`Task "${task.title}" marked as in progress`);
  } else {
    task.status = 'Completed';
    toast.success(`Task "${task.title}" completed!`);
  }
};

const viewTaskDetails = (task) => {
  // In a real application, this would navigate to a task detail page or open a modal
  toast.info(`Viewing details for: ${task.title}`);
};
</script>

<style scoped>
.shadow-card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
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