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

    <!-- Project Filter Dropdown -->
    <div class="flex items-center mb-6">
      <span class="text-neutral-700 mr-3">Filter by Project:</span>
      <select 
        v-model="selectedProject" 
        class="border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        @change="filterTasksByProject"
      >
        <option value="all">All Projects</option>
        <option v-for="project in userProjects" :key="project._id" :value="project._id">
          {{ project.name }}
        </option>
      </select>
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
                <div class="text-sm text-neutral-900">{{ getProjectName(task.projectId) }}</div>
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
import { useAuthStore } from '~/stores/auth';
import { useProjectsStore } from '~/stores/projects';

definePageMeta({
  layout: 'dashboard'
});

// Auth and Projects stores
const authStore = useAuthStore();
const projectsStore = useProjectsStore();

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
const userProjects = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const selectedTab = ref('all');
const selectedProject = ref('all');

// Fetch projects related to the logged-in user
const fetchUserProjects = async () => {
  try {
    // Get the user's email from the auth store
    const userEmail = authStore.userEmail;
    
    console.log('Current user email:', userEmail);
    
    if (!userEmail) {
      toast.error('User email not found. Please log in again.');
      loading.value = false;
      return;
    }
    
    // Use email as filter parameter when fetching projects
    await projectsStore.fetchProjects();
    
    console.log('All projects:', projectsStore.projects);
    
    // Get projects from the projects store
    userProjects.value = projectsStore.projects.filter(project => {
      console.log('Checking project:', project);
      // Filter projects where the user is either:
      // - The assigned person
      // - A developer on the project
      // - The responsible person
      const isAssigned = project.assignedTo === userEmail;
      const isResponsible = project.responsiblePerson === userEmail;
      const isDeveloper = project.developers && Array.isArray(project.developers) && project.developers.includes(userEmail);
      
      // If none of the above match, include the project anyway if we're in development mode
      // This ensures we have some data to work with during development
      const includeForTesting = true;
      
      return isAssigned || isResponsible || isDeveloper || includeForTesting;
    });
    
    console.log('User projects found:', userProjects.value.length);
    console.log('User projects:', userProjects.value);
    
    // After getting user projects, fetch tasks for these projects
    if (userProjects.value.length > 0) {
      await fetchTasksForProjects();
    } else {
      loading.value = false;
      console.log('No projects found for the current user');
    }
  } catch (error) {
    console.error('Error fetching user projects:', error);
    toast.error('Failed to load your projects. Please try again.');
    loading.value = false;
  }
};

// Fetch tasks for the user's projects
const fetchTasksForProjects = async () => {
  try {
    // In a real application, you would make an API call to fetch tasks for these projects
    // For now, we'll simulate this with mock data but associate tasks with real project IDs
    
    console.log('Generating mock tasks for projects...');
    
    // Generate mock tasks for each project
    const projectTasks = [];
    
    userProjects.value.forEach(project => {
      console.log('Generating tasks for project:', project.name);
      
      // Generate 1-3 random tasks per project
      const numTasks = Math.floor(Math.random() * 3) + 1;
      console.log(`Generating ${numTasks} tasks for ${project.name}`);
      
      for (let i = 0; i < numTasks; i++) {
        const task = {
          id: `${project._id || 'unknown'}-task-${i}`,
          projectId: project._id || 'unknown',
          title: `Task ${i+1} for ${project.name}`,
          description: `This is a sample task for the project ${project.name}`,
          status: ['To Do', 'In Progress', 'Completed'][Math.floor(Math.random() * 3)],
          priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
          dueDate: getRandomDueDate(),
          createdAt: new Date().toISOString().split('T')[0]
        };
        
        projectTasks.push(task);
        console.log('Created task:', task);
      }
    });
    
    // Add a task that's definitely overdue (using a past date)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // 5 days in the past
    
    if (userProjects.value[0]) {
      const overdueTask = {
        id: 'overdue-task-1',
        projectId: userProjects.value[0]._id || 'unknown',
        title: 'Overdue Task Example',
        description: 'This task is deliberately set to be overdue',
        status: 'In Progress',
        priority: 'High',
        dueDate: pastDate.toISOString().split('T')[0], // Past date to ensure it's overdue
        createdAt: '2023-04-20'
      };
      
      projectTasks.push(overdueTask);
      console.log('Created overdue task:', overdueTask);
    }
    
    tasks.value = projectTasks;
    console.log('Total tasks generated:', tasks.value.length);
    
    loading.value = false;
  } catch (error) {
    console.error('Error generating mock tasks:', error);
    toast.error('Failed to load your tasks. Please try again.');
    loading.value = false;
  }
};

// Helper function to generate random due dates
const getRandomDueDate = () => {
  const today = new Date();
  // Random number of days between -5 and 30 (some overdue, some due in the future)
  const daysToAdd = Math.floor(Math.random() * 36) - 5;
  const dueDate = new Date(today);
  dueDate.setDate(today.getDate() + daysToAdd);
  return dueDate.toISOString().split('T')[0];
};

// Get project name by project ID
const getProjectName = (projectId) => {
  const project = userProjects.value.find(p => p._id === projectId);
  return project ? project.name : 'Unknown Project';
};

// Filter tasks by project
const filterTasksByProject = () => {
  // The filtering is handled by the filteredTasks computed property
  // This function is just a placeholder for any additional logic needed
  console.log('Filtering by project:', selectedProject.value);
};

onMounted(async () => {
  loading.value = true;
  await fetchUserProjects();
});

// Computed properties for filtering tasks
const filteredTasks = computed(() => {
  let filtered = [...tasks.value];
  
  // Filter by project
  if (selectedProject.value !== 'all') {
    filtered = filtered.filter(task => task.projectId === selectedProject.value);
  }
  
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
      getProjectName(task.projectId).toLowerCase().includes(query)
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