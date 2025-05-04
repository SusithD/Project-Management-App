<script setup>
import { ref, computed, onMounted, watch } from 'vue';
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

// Fetch projects on component mount
onMounted(async () => {
  isLoading.value = true;
  await projectsStore.fetchProjects();
  isLoading.value = false;
  
  // Initialize charts after data is loaded
  initializeCharts();
});

// Filter projects by status
const ongoingProjects = computed(() => 
  projectsStore.projects
    .filter(p => p.status === 'Ongoing')
    .filter(p => p.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
);

const completedProjects = computed(() => 
  projectsStore.projects
    .filter(p => p.status === 'Completed')
    .filter(p => p.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
);

const onHoldProjects = computed(() => 
  projectsStore.projects
    .filter(p => p.status === 'On Hold')
    .filter(p => p.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
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
    new Chart(statusChartCtx, {
      type: 'doughnut',
      data: {
        labels: ['Ongoing', 'Completed', 'On Hold'],
        datasets: [{
          data: [ongoingCount.value, completedCount.value, onHoldCount.value],
          backgroundColor: [
            '#4f46e5', // primary color for ongoing
            '#10b981', // success color for completed
            '#f59e0b'  // warning color for on hold
          ],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${value} projects`;
              }
            }
          }
        }
      }
    });
  }
  
  // Progress over time chart (placeholder - would normally use real time data)
  const progressChartCtx = document.getElementById('progressChart');
  if (progressChartCtx) {
    new Chart(progressChartCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Completed Projects',
          data: [2, 5, 7, 12, 15, completedCount.value],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }, {
          label: 'Ongoing Projects',
          data: [4, 6, 8, 9, 10, ongoingCount.value],
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
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

    <!-- Header with search and action buttons -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
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
      :is-open="isNewProjectModalOpen" 
      @close="closeNewProjectModal"
    />
  </div>
</template>