<template>
  <div class="relative">
    <!-- Loading overlay -->
    <div v-if="isLoading" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-3 text-neutral-700 font-medium">Loading reports...</p>
      </div>
    </div>

    <!-- Header with search and action buttons -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div class="flex flex-col w-full md:w-auto mb-4 md:mb-0">
        <h1 class="text-3xl font-bold text-neutral-900 mb-2">Reports Dashboard</h1>
        <p class="text-neutral-600">View and analyze project performance metrics</p>
      </div>
      
      <div class="flex flex-col sm:flex-row w-full md:w-auto gap-4">
        <div class="relative">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search projects..." 
            class="pl-10 pr-4 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-neutral-500 sm:text-sm">
              <span class="mdi mdi-magnify"></span>
            </span>
          </div>
        </div>
        
        <button 
          @click="exportReports"
          class="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-300"
          :disabled="isExporting"
        >
          <span v-if="isExporting" class="mdi mdi-loading mdi-spin text-lg mr-2"></span>
          <span v-else class="mdi mdi-file-export text-lg mr-2"></span>
          {{ isExporting ? 'Exporting...' : 'Export Reports' }}
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
      
      <!-- Projects at Risk -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
            <span class="mdi mdi-alert-circle-outline text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">At Risk</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ atRiskCount }}</p>
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
    
    <!-- Team Performance Section -->
    <div class="bg-white rounded-xl shadow-card mb-8 overflow-hidden">
      <div class="border-b border-neutral-200 p-5">
        <h2 class="text-xl font-semibold text-neutral-800">Team Performance</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Team Member
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Assigned Projects
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Completed Projects
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Average Progress
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                On-time Completion
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            <tr v-if="teamPerformance.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-sm text-neutral-500">
                <div class="flex flex-col items-center">
                  <span class="mdi mdi-account-group-outline text-4xl text-neutral-400 mb-2"></span>
                  No team performance data available.
                </div>
              </td>
            </tr>
            <tr v-for="member in teamPerformance" :key="member.id" class="hover:bg-neutral-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <span class="mdi mdi-account text-lg"></span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-neutral-900">{{ member.name }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {{ member.role }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {{ member.assignedProjects }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {{ member.completedProjects }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-full bg-neutral-200 rounded-full h-2 mr-2 max-w-[100px]">
                    <div 
                      :class="[
                        'h-2 rounded-full',
                        member.avgProgress >= 80 ? 'bg-success-600' : 
                        member.avgProgress >= 40 ? 'bg-accent-600' : 'bg-warning-600'
                      ]"
                      :style="`width: ${member.avgProgress}%`"
                    ></div>
                  </div>
                  <span class="text-xs font-medium text-neutral-700">{{ member.avgProgress }}%</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-full bg-neutral-200 rounded-full h-2 mr-2 max-w-[100px]">
                    <div 
                      :class="[
                        'h-2 rounded-full',
                        member.onTimeRate >= 80 ? 'bg-success-600' : 
                        member.onTimeRate >= 50 ? 'bg-accent-600' : 'bg-warning-600'
                      ]"
                      :style="`width: ${member.onTimeRate}%`"
                    ></div>
                  </div>
                  <span class="text-xs font-medium text-neutral-700">{{ member.onTimeRate }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
            @click="selectedTab = 'all'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'all' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            All Projects ({{ totalProjects }})
          </button>
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
            @click="selectedTab = 'atrisk'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'atrisk' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            At Risk ({{ atRiskCount }})
          </button>
        </div>
      </div>
      
      <!-- Projects Grid -->
      <div class="p-5">
        <div v-if="filteredProjects.length === 0" class="text-center py-8">
          <span class="mdi mdi-folder-outline text-5xl text-neutral-300"></span>
          <p class="mt-2 text-neutral-600">No projects found</p>
          <p v-if="searchQuery" class="text-sm text-neutral-500">Try a different search term</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div 
            v-for="project in filteredProjects" 
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
                  <span class="truncate">{{ getUserName(project.assignedTo) }}</span>
                </div>
                <div class="flex items-center mb-2">
                  <span class="mdi mdi-calendar text-lg mr-2 text-neutral-500"></span>
                  <span class="truncate">{{ project.startDate || 'N/A' }} - {{ project.endDate || 'N/A' }}</span>
                </div>
                <div class="flex items-center">
                  <span :class="['mdi mr-2 text-lg text-neutral-500', project.daysToDeadline < 0 ? 'mdi-alert-circle' : 'mdi-clock-outline']"></span>
                  <span class="truncate" :class="getDaysToDeadlineClass(project.daysToDeadline)">
                    {{ project.daysToDeadline === 'N/A' ? 'No deadline set' : 
                      project.daysToDeadline < 0 ? Math.abs(project.daysToDeadline) + ' days overdue' : 
                      project.daysToDeadline + ' days remaining' }}
                  </span>
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
              <span 
                :class="[
                  'px-2 py-1 text-xs rounded-full flex items-center',
                  getRiskClass(project.riskLevel)
                ]"
              >
                <span class="mdi mdi-flag-variant mr-1"></span>
                {{ project.riskLevel }} Risk
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-neutral-50 px-6 py-3 border-t border-neutral-200 text-sm text-neutral-500">
        Showing {{ filteredProjects.length }} of {{ projects.length }} projects
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useUsersStore } from '~/stores/users';
import { useProjectsStore } from '~/stores/projects';
import { useNotificationsStore } from '~/stores/notifications';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

// Define layout
definePageMeta({
  layout: 'dashboard'
});

// Stores
const usersStore = useUsersStore();
const projectsStore = useProjectsStore();
const notificationsStore = useNotificationsStore();

// UI State
const isLoading = ref(true);
const selectedTab = ref('all');
const searchQuery = ref('');
const isExporting = ref(false);

// Data
const projects = ref([]);
const users = ref([]);

// Filter states
const filters = ref({
  dateRange: '30',
  status: 'all',
  teamMember: 'all',
});

// Computed properties
const totalProjects = computed(() => projects.value.length);
const completedProjects = computed(() => projects.value.filter(p => p.status === 'Completed'));
const ongoingProjects = computed(() => projects.value.filter(p => p.status === 'Ongoing'));
const onHoldProjects = computed(() => projects.value.filter(p => p.status === 'On Hold'));

const completedCount = computed(() => completedProjects.value.length);
const ongoingCount = computed(() => ongoingProjects.value.length);
const onHoldCount = computed(() => onHoldProjects.value.length);

// Calculate metrics
const completionPercentage = computed(() => {
  return Math.round((completedCount.value / totalProjects.value) * 100) || 0;
});

const averageProgress = computed(() => {
  if (ongoingProjects.value.length === 0) return 0;
  const total = ongoingProjects.value.reduce((acc, project) => acc + project.progress, 0);
  return Math.round(total / ongoingProjects.value.length);
});

// Calculate projects at risk
const projectsAtRisk = computed(() => {
  const now = new Date();
  return projects.value.filter(p => {
    if (p.status === 'Completed') return false;
    if (!p.endDate) return false;
    const deadline = new Date(p.endDate);
    const daysToDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return (daysToDeadline < 0) || 
           (daysToDeadline < 7 && p.progress < 80);
  });
});

const atRiskCount = computed(() => projectsAtRisk.value.length);

const filteredProjects = computed(() => {
  let result = projects.value;
  
  // Apply status filter based on selected tab
  if (selectedTab.value !== 'all') {
    switch(selectedTab.value) {
      case 'ongoing':
        result = ongoingProjects.value;
        break;
      case 'completed':
        result = completedProjects.value;
        break;
      case 'onhold':
        result = onHoldProjects.value;
        break;
      case 'atrisk':
        result = projectsAtRisk.value;
        break;
    }
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.assignedTo && getUserName(p.assignedTo).toLowerCase().includes(query))
    );
  }
  
  return result.map(project => {
    // Calculate days to deadline
    const daysToDeadline = project.endDate ? 
      Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
    
    // Calculate risk level based on progress and days to deadline
    let riskLevel = 'Low';
    if (project.status !== 'Completed') {
      if (daysToDeadline !== null) {
        if (daysToDeadline < 0) {
          riskLevel = 'Overdue';
        } else if (daysToDeadline < 7 && project.progress < 80) {
          riskLevel = 'High';
        } else if (daysToDeadline < 14 && project.progress < 60) {
          riskLevel = 'Medium';
        }
      }
    }
    
    return {
      ...project,
      daysToDeadline: daysToDeadline !== null ? daysToDeadline : 'N/A',
      riskLevel
    };
  });
});

// Team performance data
const teamPerformance = ref([]);

// Methods
const applyFilters = () => {
  notificationsStore.success('Filters applied successfully');
};

const exportReports = async () => {
  isExporting.value = true;
  
  try {
    // Logic for exporting reports would go here
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    notificationsStore.success('Reports exported successfully');
  } catch (error) {
    console.error('Error exporting reports:', error);
    notificationsStore.error('Failed to export reports');
  } finally {
    isExporting.value = false;
  }
};

const getUserName = (userId) => {
  const user = users.value.find(u => u._id === userId);
  return user ? user.name : 'Unknown User';
};

const getStatusColorClass = (status) => {
  switch (status) {
    case 'Ongoing': return 'bg-accent-100 text-accent-700';
    case 'Completed': return 'bg-success-100 text-success-800';
    case 'On Hold': return 'bg-warning-100 text-warning-700';
    default: return 'bg-neutral-100 text-neutral-700';
  }
};

const getDaysToDeadlineClass = (days) => {
  if (days === 'N/A') return 'text-neutral-500';
  if (days < 0) return 'text-error-600 font-medium';
  if (days < 7) return 'text-warning-600 font-medium';
  if (days < 14) return 'text-accent-600';
  return 'text-success-600';
};

const getRiskClass = (risk) => {
  switch (risk.toLowerCase()) {
    case 'high':
      return 'bg-error-100 text-error-800';
    case 'medium':
      return 'bg-warning-100 text-warning-800';
    case 'low':
      return 'bg-success-100 text-success-800';
    case 'overdue':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

const navigateToProject = (projectId) => {
  navigateTo(`/projects/${projectId}`);
};

// Data fetching
const fetchProjects = async () => {
  await projectsStore.fetchProjects();
  projects.value = projectsStore.projects;
  calculateTeamPerformance();
};

const fetchUsers = async () => {
  await usersStore.fetchUsers();
  users.value = usersStore.allUsers;
};

// Calculate team performance metrics
const calculateTeamPerformance = () => {
  // Reset team performance
  teamPerformance.value = [];
  
  // For each user, calculate performance metrics
  users.value.forEach(user => {
    const userProjects = projects.value.filter(p => 
      (p.team && p.team.includes(user._id)) || p.assignedTo === user._id);
    
    if (userProjects.length === 0) return;
    
    const completed = userProjects.filter(p => p.status === 'Completed');
    let onTimeCount = 0;
    
    completed.forEach(p => {
      // Check if project was completed before deadline
      if (p.endDate) {
        const completedDate = new Date(p.lastUpdated);
        const deadlineDate = new Date(p.endDate);
        if (completedDate <= deadlineDate) {
          onTimeCount++;
        }
      }
    });
    
    const avgProgress = userProjects.reduce((sum, p) => sum + p.progress, 0) / userProjects.length;
    const onTimeRate = completed.length ? Math.round((onTimeCount / completed.length) * 100) : 0;
    
    teamPerformance.value.push({
      id: user._id,
      name: user.name,
      role: user.role || 'Team Member',
      assignedProjects: userProjects.length,
      completedProjects: completed.length,
      avgProgress: Math.round(avgProgress),
      onTimeRate
    });
  });
  
  // Sort by most assigned projects first
  teamPerformance.value.sort((a, b) => b.assignedProjects - a.assignedProjects);
};

// Chart initialization
const initializeCharts = () => {
  // Project status distribution chart
  const statusChartCtx = document.getElementById('statusChart');
  if (statusChartCtx) {
    new Chart(statusChartCtx, {
      type: 'doughnut',
      data: {
        labels: ['Ongoing', 'Completed', 'On Hold', 'At Risk'],
        datasets: [{
          data: [ongoingCount.value, completedCount.value, onHoldCount.value, atRiskCount.value],
          backgroundColor: [
            '#4f46e5', // primary color for ongoing
            '#10b981', // success color for completed
            '#f59e0b', // warning color for on hold
            '#ef4444'  // error color for at risk
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

// Watch for search query changes
watch(searchQuery, () => {
  // Reinitialize charts when the data changes due to filtering
  setTimeout(initializeCharts, 100);
});

// Lifecycle hooks
onMounted(async () => {
  isLoading.value = true;
  try {
    await fetchUsers();
    await fetchProjects();
    
    // Initialize charts after data is loaded
    setTimeout(initializeCharts, 100);
  } catch (error) {
    console.error('Error loading report data:', error);
    notificationsStore.error('Failed to load report data');
  } finally {
    isLoading.value = false;
  }
});
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