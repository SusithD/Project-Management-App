<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useProjectsStore } from '~/stores/projects';
import { useRouter } from 'vue-router';
import NewProjectModal from '~/components/projects/NewProjectModal.vue';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

// Define layout
definePageMeta({
  layout: 'dashboard'
});

// Get projects from store and initialize router
const projectsStore = useProjectsStore();
const router = useRouter();
const isNewProjectModalOpen = ref(false);
const selectedTab = ref('ongoing');
const searchQuery = ref('');
const isLoading = ref(true);

// Add new filter states
const statusFilter = ref('all');
const priorityFilter = ref('all');
const assigneeFilter = ref('all');
const dateRangeFilter = ref('all');
const showAdvancedFilters = ref(false);

// Fetch projects on component mount
onMounted(async () => {
  isLoading.value = true;
  await projectsStore.fetchProjects();
  isLoading.value = false;
  
  // Initialize charts after data is loaded
  initializeCharts();
});

// Enhanced filtering with multiple criteria
const filteredProjects = computed(() => {
  let filtered = projectsStore.projects;
  
  // Text search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.assignedTo?.toLowerCase().includes(query)
    );
  }
  
  // Status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(p => p.status === statusFilter.value);
  }
  
  // Priority filter
  if (priorityFilter.value !== 'all') {
    filtered = filtered.filter(p => p.priority === priorityFilter.value);
  }
  
  // Assignee filter
  if (assigneeFilter.value !== 'all') {
    filtered = filtered.filter(p => p.assignedTo === assigneeFilter.value);
  }
  
  // Date range filter
  if (dateRangeFilter.value !== 'all') {
    const now = new Date();
    const filterDate = new Date();
    
    switch (dateRangeFilter.value) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3);
        break;
    }
    
    filtered = filtered.filter(p => 
      new Date(p.lastUpdated || p.startDate) >= filterDate
    );
  }
  
  return filtered;
});

// Update existing computed properties to use filtered projects
const ongoingProjects = computed(() => 
  filteredProjects.value.filter(p => p.status === 'Ongoing')
);

const completedProjects = computed(() => 
  filteredProjects.value.filter(p => p.status === 'Completed')
);

const onHoldProjects = computed(() => 
  filteredProjects.value.filter(p => p.status === 'On Hold')
);

// Summary stats
const totalProjects = computed(() => projectsStore.projects.length);
const completedCount = computed(() => completedProjects.value.length);
const ongoingCount = computed(() => ongoingProjects.value.length);
const onHoldCount = computed(() => onHoldProjects.value.length);

// Calculate completion percentage
const completionPercentage = computed(() => {
  return Math.round((completedCount.value / totalProjects.value) * 100) || 0;
});

// Calculate average progress of ongoing projects
const averageProgress = computed(() => {
  if (ongoingProjects.value.length === 0) return 0;
  const total = ongoingProjects.value.reduce((acc, project) => acc + project.progress, 0);
  return Math.round(total / ongoingProjects.value.length);
});

// Open new project modal
const openNewProjectModal = () => {
  isNewProjectModalOpen.value = true;
};

// Close new project modal
const closeNewProjectModal = () => {
  isNewProjectModalOpen.value = false;
};

// Navigation functions
const navigateToProject = (projectId) => {
  router.push(`/projects/${projectId}`);
};

const navigateToProjectUpdate = (projectId, event) => {
  event.preventDefault();
  router.push(`/projects/${projectId}?edit=true`);
};

// Chart initialization
const initializeCharts = () => {
  // Project status distribution chart
  const statusChartCtx = document.getElementById('statusChart');
  if (statusChartCtx) {
    const statusChartData = {
      labels: ['Ongoing', 'Completed', 'On Hold'],
      datasets: [
        {
          data: [ongoingCount.value, completedCount.value, onHoldCount.value],
          backgroundColor: ['#4f46e5', '#10b981', '#f59e0b'], // Colors for statuses
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };

    const statusChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${value} projects`;
            },
          },
        },
      },
    };

    new Chart(statusChartCtx, {
      type: 'doughnut',
      data: statusChartData,
      options: statusChartOptions,
    });
  }

  // Progress over time chart
  const progressChartCtx = document.getElementById('progressChart');
  if (progressChartCtx) {
    const progressChartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Completed Projects',
          data: [2, 5, 7, 12, 15, completedCount.value],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Ongoing Projects',
          data: [4, 6, 8, 9, 10, ongoingCount.value],
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };

    const progressChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
        x: {
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
      },
    };

    new Chart(progressChartCtx, {
      type: 'line',
      data: progressChartData,
      options: progressChartOptions,
    });
  }
};

// Function to get appropriate color class based on status
const getStatusColorClass = (status) => {
  switch (status) {
    case 'Ongoing': return 'bg-accent-100 text-accent-700';
    case 'Completed': return 'bg-success-100 text-success-800';
    case 'On Hold': return 'bg-warning-100 text-warning-700';
    default: return 'bg-neutral-100 text-neutral-700';
  }
};

// Get visible projects based on selected tab
const visibleProjects = computed(() => {
  switch (selectedTab.value) {
    case 'ongoing': return ongoingProjects.value;
    case 'completed': return completedProjects.value;
    case 'onhold': return onHoldProjects.value;
    default: return projectsStore.projects;
  }
});

// Watch for search query changes
watch(searchQuery, () => {
  // Reinitialize charts when the data changes due to filtering
  setTimeout(initializeCharts, 100);
});

// Clear all filters function
const clearAllFilters = () => {
  searchQuery.value = '';
  statusFilter.value = 'all';
  priorityFilter.value = 'all';
  assigneeFilter.value = 'all';
  dateRangeFilter.value = 'all';
  showAdvancedFilters.value = false;
};

// Export functionality
const exportProjects = (format) => {
  const data = filteredProjects.value;
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } else if (format === 'csv') {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects_${timestamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

const convertToCSV = (data) => {
  const headers = ['Name', 'Status', 'Priority', 'Assigned To', 'Progress', 'Start Date', 'End Date'];
  const csvRows = [headers.join(',')];
  
  data.forEach(project => {
    const row = [
      `"${project.name}"`,
      project.status,
      project.priority || 'Medium',
      `"${project.assignedTo}"`,
      project.progress || 0,
      project.startDate,
      project.endDate
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};

// Advanced analytics computed properties
const projectMetrics = computed(() => {
  const projects = filteredProjects.value;
  
  // Performance metrics
  const overdue = projects.filter(p => {
    if (p.status === 'Completed') return false;
    const deadline = new Date(p.endDate || p.deadline);
    return deadline < new Date();
  });
  
  const atRisk = projects.filter(p => {
    if (p.status === 'Completed') return false;
    const progress = p.progress || 0;
    const daysRemaining = p.endDate ? Math.ceil((new Date(p.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
    return progress < 50 && daysRemaining < 30;
  });
  
  // Team workload
  const teamWorkload = {};
  projects.forEach(p => {
    if (p.assignedTo && p.status === 'Ongoing') {
      teamWorkload[p.assignedTo] = (teamWorkload[p.assignedTo] || 0) + 1;
    }
  });
  
  // Priority distribution
  const priorityDistribution = {
    High: projects.filter(p => p.priority === 'High').length,
    Medium: projects.filter(p => p.priority === 'Medium').length,
    Low: projects.filter(p => p.priority === 'Low').length
  };
  
  return {
    overdue: overdue.length,
    atRisk: atRisk.length,
    teamWorkload,
    priorityDistribution,
    avgProgress: projects.length ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length) : 0
  };
});

// Real-time updates simulation
const lastRefresh = ref(new Date());
const autoRefreshEnabled = ref(false);
let refreshInterval = null;

const toggleAutoRefresh = () => {
  autoRefreshEnabled.value = !autoRefreshEnabled.value;
  
  if (autoRefreshEnabled.value) {
    refreshInterval = setInterval(() => {
      refreshData();
    }, 30000); // Refresh every 30 seconds
  } else if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

const refreshData = async () => {
  try {
    await projectsStore.fetchProjects();
    lastRefresh.value = new Date();
    initializeCharts();
  } catch (error) {
    console.error('Error refreshing data:', error);
  }
};

// Keyboard shortcuts
const handleKeyPress = (event) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'f':
        event.preventDefault();
        document.querySelector('input[placeholder*="Search"]')?.focus();
        break;
      case 'n':
        event.preventDefault();
        openNewProjectModal();
        break;
      case 'r':
        event.preventDefault();
        refreshData();
        break;
    }
  }
};

// Add keyboard shortcuts on mount
onMounted(() => {
  document.addEventListener('keydown', handleKeyPress);
});

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress);
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
</script>

<template>
  <div class="relative">
    <!-- Loading overlay -->
    <div v-if="isLoading" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-3 text-neutral-700 font-medium">Loading projects...</p>
      </div>
    </div>

    <!-- Mobile-optimized header for smaller screens -->
    <div class="md:hidden mb-6">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <button 
          @click="openNewProjectModal"
          class="inline-flex items-center justify-center w-10 h-10 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-300"
        >
          <span class="mdi mdi-plus text-xl"></span>
        </button>
      </div>
      
      <!-- Mobile Quick Stats -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-white p-3 rounded-lg shadow-sm border border-neutral-200">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600">{{ ongoingCount }}</div>
            <div class="text-xs text-neutral-600">Ongoing</div>
          </div>
        </div>
        <div class="bg-white p-3 rounded-lg shadow-sm border border-neutral-200">
          <div class="text-center">
            <div class="text-2xl font-bold text-success-600">{{ completedCount }}</div>
            <div class="text-xs text-neutral-600">Completed</div>
          </div>
        </div>
      </div>
      
      <!-- Mobile Search -->
      <div class="relative mb-4">
        <span class="mdi mdi-magnify absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"></span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search projects..."
          class="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
    </div>

    <!-- Header with search and action buttons -->
    <div class="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div class="flex flex-col w-full md:w-auto mb-4 md:mb-0">
        <h1 class="text-3xl font-bold text-neutral-900 mb-2">Project Dashboard</h1>
        <p class="text-neutral-600">Track and manage all your projects in one place</p>
      </div>
      
      <div class="flex flex-col sm:flex-row w-full md:w-auto gap-4">
        <button 
          @click="openNewProjectModal"
          class="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-300"
        >
          <span class="mdi mdi-plus text-lg mr-2"></span>
          Add New Project
        </button>
      </div>
    </div>

    <!-- Enhanced Search and Filter Bar -->
    <div class="bg-white rounded-xl shadow-card p-6 mb-8">
      <div class="flex flex-col lg:flex-row gap-4">
        <!-- Search Input -->
        <div class="flex-1">
          <div class="relative">
            <span class="mdi mdi-magnify absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-lg"></span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search projects by name, description, or assignee..."
              class="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
        </div>
        
        <!-- Quick Filters -->
        <div class="flex flex-wrap gap-3">
          <select 
            v-model="statusFilter"
            class="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[120px]"
          >
            <option value="all">All Status</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
          
          <select 
            v-model="priorityFilter"
            class="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[120px]"
          >
            <option value="all">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          
          <button
            @click="showAdvancedFilters = !showAdvancedFilters"
            class="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center"
            :class="{ 'bg-neutral-100': showAdvancedFilters }"
          >
            <span class="mdi mdi-filter-variant text-lg mr-1"></span>
            Filters
          </button>
        </div>
      </div>
      
      <!-- Advanced Filters (Collapsible) -->
      <transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 max-h-0"
        enter-to-class="opacity-100 max-h-32"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 max-h-32"
        leave-to-class="opacity-0 max-h-0"
      >
        <div v-show="showAdvancedFilters" class="mt-4 pt-4 border-t border-neutral-200 overflow-hidden">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-1">Assignee</label>
              <select 
                v-model="assigneeFilter"
                class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Assignees</option>
                <option v-for="project in projectsStore.projects" :key="project.assignedTo" :value="project.assignedTo">
                  {{ project.assignedTo }}
                </option>
              </select>
            </div>
            
            <div class="flex items-end">
              <button
                @click="clearAllFilters"
                class="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      </transition>
      
      <!-- Filter Results Summary -->
      <div v-if="searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all'" 
           class="mt-4 flex items-center text-sm text-neutral-600">
        <span class="mdi mdi-information-outline mr-1"></span>
        Showing {{ filteredProjects.length }} of {{ projectsStore.projects.length }} projects
      </div>
    </div>
    
    <!-- Stats Cards Row with animation -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Projects -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            <span class="mdi mdi-folder-multiple text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Total Projects</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ totalProjects }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-information-outline mr-1"></span>
            All time projects
          </span>
        </div>
      </div>
      
      <!-- Ongoing Projects -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center text-accent-600">
            <span class="mdi mdi-clock-outline text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Ongoing</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ ongoingCount }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-chart-line mr-1"></span>
            Avg. Progress: {{ averageProgress }}%
          </span>
        </div>
      </div>
      
      <!-- Completed Projects -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center text-success-600">
            <span class="mdi mdi-check-circle-outline text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Completed</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ completedCount }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-percent mr-1"></span>
            {{ completionPercentage }}% completion rate
          </span>
        </div>
      </div>
      
      <!-- On Hold Projects -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
            <span class="mdi mdi-pause-circle-outline text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">On Hold</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ onHoldCount }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-alert-outline mr-1"></span>
            Requires attention
          </span>
        </div>
      </div>
    </div>
    
    <!-- Analytics Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Project Status Distribution -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300">
        <h3 class="text-lg font-semibold text-neutral-800 mb-4">Project Status Distribution</h3>
        <div class="h-64">
          <canvas id="statusChart"></canvas>
        </div>
      </div>
      
      <!-- Progress Over Time -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300">
        <h3 class="text-lg font-semibold text-neutral-800 mb-4">Progress Over Time</h3>
        <div class="h-64">
          <canvas id="progressChart"></canvas>
        </div>
      </div>
    </div>
    
    <!-- Projects Section with Tabs -->
    <div class="bg-white rounded-xl shadow-card mb-8 overflow-hidden">
      <div class="border-b border-neutral-200 p-5">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-neutral-800">Projects Overview</h2>
          <a href="/projects" class="text-primary-600 hover:text-primary-700 text-sm flex items-center">
            View all
            <span class="mdi mdi-chevron-right ml-1"></span>
          </a>
        </div>
        
        <!-- Tabs Navigation -->
        <div class="flex mt-4 border-b border-neutral-200">
          <button 
            @click="selectedTab = 'ongoing'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'ongoing' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Ongoing ({{ ongoingCount }})
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
            Completed ({{ completedCount }})
          </button>
          <button 
            @click="selectedTab = 'onhold'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'onhold' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            On Hold ({{ onHoldCount }})
          </button>
        </div>
      </div>
      
      <!-- Projects Grid -->
      <div class="p-5">
        <div v-if="visibleProjects.length === 0" class="text-center py-8">
          <span class="mdi mdi-folder-outline text-5xl text-neutral-300"></span>
          <p class="mt-2 text-neutral-600">No projects found</p>
          <p v-if="searchQuery" class="text-sm text-neutral-500">Try a different search term</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div 
            v-for="project in visibleProjects" 
            :key="project.id" 
            class="bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div class="p-4">
              <div class="flex justify-between items-start mb-3">
                <h3 class="font-medium text-lg text-neutral-900 truncate">{{ project.name }}</h3>
                <span 
                  :class="[
                    'px-2 py-1 text-xs rounded-full',
                    getStatusColorClass(project.status)
                  ]"
                >
                  {{ project.status }}
                </span>
              </div>
              
              <div class="mb-4" v-if="project.status === 'Ongoing'">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-neutral-600">Progress</span>
                  <span class="font-medium">{{ project.progress }}%</span>
                </div>
                <div class="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    class="bg-primary-600 h-2.5 rounded-full transition-all duration-1000" 
                    :style="`width: ${project.progress}%`"
                  ></div>
                </div>
              </div>
              
              <div class="text-sm text-neutral-600">
                <div class="flex items-center mb-2">
                  <span class="mdi mdi-account text-lg mr-2 text-neutral-500"></span>
                  <span class="truncate">{{ project.assignedTo }}</span>
                </div>
                <div class="flex items-center mb-2">
                  <span class="mdi mdi-calendar text-lg mr-2 text-neutral-500"></span>
                  <span class="truncate">{{ project.startDate }} - {{ project.endDate }}</span>
                </div>
                <div class="flex items-center">
                  <span class="mdi mdi-clock-outline text-lg mr-2 text-neutral-500"></span>
                  <span class="truncate">Last updated: {{ project.lastUpdated }}</span>
                </div>
              </div>
            </div>
            
            <div class="border-t border-neutral-200 p-3 bg-neutral-50 flex justify-between">
              <button 
                @click="navigateToProject(project.id)" 
                class="text-sm text-primary-600 hover:text-primary-700 flex items-center transition-colors duration-200"
              >
                <span class="mdi mdi-eye mr-1"></span>
                View details
              </button>
              <button 
                @click="navigateToProjectUpdate(project.id, $event)"
                class="text-sm text-primary-600 hover:text-primary-700 flex items-center transition-colors duration-200"
              >
                <span class="mdi mdi-pencil mr-1"></span>
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- New Project Modal -->
    <NewProjectModal 
      :open="isNewProjectModalOpen" 
      @close="closeNewProjectModal"
    />
    
    <!-- Advanced Analytics Dashboard -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Performance Metrics -->
      <div class="bg-white p-6 rounded-xl shadow-card">
        <h3 class="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
          <span class="mdi mdi-chart-line mr-2 text-primary-600"></span>
          Performance Metrics
        </h3>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-error-50 rounded-lg">
            <div class="flex items-center">
              <span class="mdi mdi-alert-circle text-error-600 text-xl mr-2"></span>
              <span class="text-sm font-medium text-error-800">Overdue Projects</span>
            </div>
            <span class="text-lg font-bold text-error-700">{{ projectMetrics.overdue }}</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
            <div class="flex items-center">
              <span class="mdi mdi-clock-alert text-warning-600 text-xl mr-2"></span>
              <span class="text-sm font-medium text-warning-800">At Risk</span>
            </div>
            <span class="text-lg font-bold text-warning-700">{{ projectMetrics.atRisk }}</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
            <div class="flex items-center">
              <span class="mdi mdi-speedometer text-primary-600 text-xl mr-2"></span>
              <span class="text-sm font-medium text-primary-800">Avg Progress</span>
            </div>
            <span class="text-lg font-bold text-primary-700">{{ projectMetrics.avgProgress }}%</span>
          </div>
        </div>
      </div>
      
      <!-- Team Workload -->
      <div class="bg-white p-6 rounded-xl shadow-card">
        <h3 class="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
          <span class="mdi mdi-account-group mr-2 text-accent-600"></span>
          Team Workload
        </h3>
        
        <div class="space-y-3">
          <div v-if="Object.keys(projectMetrics.teamWorkload).length === 0" class="text-center py-4">
            <span class="mdi mdi-account-off text-3xl text-neutral-300"></span>
            <p class="text-sm text-neutral-500 mt-2">No active assignments</p>
          </div>
          
          <div v-else v-for="(count, member) in projectMetrics.teamWorkload" :key="member" 
               class="flex items-center justify-between p-2 hover:bg-neutral-50 rounded-lg transition-colors">
            <div class="flex items-center">
              <div class="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center mr-3">
                <span class="text-accent-600 text-sm font-medium">{{ member.charAt(0).toUpperCase() }}</span>
              </div>
              <span class="text-sm font-medium text-neutral-700 truncate">{{ member }}</span>
            </div>
            <div class="flex items-center">
              <span class="text-lg font-bold text-neutral-900 mr-2">{{ count }}</span>
              <div class="w-12 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div class="h-full bg-accent-500 rounded-full transition-all duration-500"
                     :style="`width: ${Math.min(count * 20, 100)}%`"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Priority Distribution -->
      <div class="bg-white p-6 rounded-xl shadow-card">
        <h3 class="text-lg font-semibold text-neutral-800 mb-4 flex items-center">
          <span class="mdi mdi-flag mr-2 text-warning-600"></span>
          Priority Distribution
        </h3>
        
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-error-50 rounded-lg">
            <div class="flex items-center">
              <span class="w-3 h-3 bg-error-500 rounded-full mr-3"></span>
              <span class="text-sm font-medium text-error-800">High Priority</span>
            </div>
            <span class="text-lg font-bold text-error-700">{{ projectMetrics.priorityDistribution.High }}</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
            <div class="flex items-center">
              <span class="w-3 h-3 bg-warning-500 rounded-full mr-3"></span>
              <span class="text-sm font-medium text-warning-800">Medium Priority</span>
            </div>
            <span class="text-lg font-bold text-warning-700">{{ projectMetrics.priorityDistribution.Medium }}</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-success-50 rounded-lg">
            <div class="flex items-center">
              <span class="w-3 h-3 bg-success-500 rounded-full mr-3"></span>
              <span class="text-sm font-medium text-success-800">Low Priority</span>
            </div>
            <span class="text-lg font-bold text-success-700">{{ projectMetrics.priorityDistribution.Low }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick Actions and Tools -->
    <div class="bg-white rounded-xl shadow-card p-6 mb-8">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h3 class="text-lg font-semibold text-neutral-800 mb-4 md:mb-0 flex items-center">
          <span class="mdi mdi-tools mr-2 text-primary-600"></span>
          Quick Actions & Tools
          </h3
          </div>
        
        <div class="flex items-center space-x-4">
            <!-- Auto Refresh Toggle -->
            <div class="flex items-center">
              <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="autoRefreshEnabled" @change="toggleAutoRefresh" class="sr-only">
              <div class="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              <span class="ml-3 text-sm font-medium text-neutral-700">Auto Refresh</span>
            </label>
          </div>
          
          <!-- Last Refresh Time -->
          <div class="text-xs text-neutral-500">
            Last updated: {{ lastRefresh.toLocaleTimeString() }}
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <button @click="refreshData" 
                class="flex flex-col items-center p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group">
          <span class="mdi mdi-refresh text-2xl text-neutral-600 group-hover:text-primary-600 mb-2"></span>
          <span class="text-sm font-medium text-neutral-700 group-hover:text-primary-700">Refresh</span>
        </button>
        
        <button @click="exportProjects('json')" 
                class="flex flex-col items-center p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group">
          <span class="mdi mdi-download text-2xl text-neutral-600 group-hover:text-primary-600 mb-2"></span>
          <span class="text-sm font-medium text-neutral-700 group-hover:text-primary-700">Export JSON</span>
        </button>
        
        <button @click="exportProjects('csv')" 
                class="flex flex-col items-center p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group">
          <span class="mdi mdi-file-delimited text-2xl text-neutral-600 group-hover:text-primary-600 mb-2"></span>
          <span class="text-sm font-medium text-neutral-700 group-hover:text-primary-700">Export CSV</span>
        </button>
        
        <a href="/reports" 
           class="flex flex-col items-center p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group">
          <span class="mdi mdi-chart-bar text-2xl text-neutral-600 group-hover:text-primary-600 mb-2"></span>
          <span class="text-sm font-medium text-neutral-700 group-hover:text-primary-700">Reports</span>
        </a>
        
        <a href="/settings" 
           class="flex flex-col items-center p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group">
          <span class="mdi mdi-cog text-2xl text-neutral-600 group-hover:text-primary-600 mb-2"></span>
          <span class="text-sm font-medium text-neutral-700 group-hover:text-primary-700">Settings</span>
        </a>
        
        <a href="/users" 
           class="flex flex-col items-center p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 group">
          <span class="mdi mdi-account-multiple text-2xl text-neutral-600 group-hover:text-primary-600 mb-2"></span>
          <span class="text-sm font-medium text-neutral-700 group-hover:text-primary-700">Team</span>
        </a>
      </div>
      
      <!-- Keyboard Shortcuts Help -->
      <div class="mt-6 p-4 bg-neutral-50 rounded-lg">
        <h4 class="text-sm font-medium text-neutral-700 mb-2 flex items-center">
          <span class="mdi mdi-keyboard mr-2"></span>
          Keyboard Shortcuts
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-neutral-600">
          <div class="flex items-center">
            <kbd class="px-2 py-1 bg-white border border-neutral-200 rounded text-xs mr-2">Ctrl+F</kbd>
            <span>Focus search</span>
          </div>
          <div class="flex items-center">
            <kbd class="px-2 py-1 bg-white border border-neutral-200 rounded text-xs mr-2">Ctrl+N</kbd>
            <span>New project</span>
          </div>
          <div class="flex items-center">
            <kbd class="px-2 py-1 bg-white border border-neutral-200 rounded text-xs mr-2">Ctrl+R</kbd>
            <span>Refresh data</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>