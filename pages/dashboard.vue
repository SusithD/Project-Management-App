<script setup>
import { ref, onMounted } from 'vue';

// Define layout
definePageMeta({
  layout: 'dashboard'
});

// Sample data - in a real app this would come from an API
const projectsData = ref([
  { 
    id: 1, 
    name: 'Website Redesign', 
    status: 'Ongoing', 
    progress: 75, 
    assignedTo: 'John Doe',
    startDate: '2023-10-15',
    endDate: '2024-05-30',
    lastUpdated: '2024-04-22'
  },
  { 
    id: 2, 
    name: 'Mobile App Development', 
    status: 'Ongoing', 
    progress: 45, 
    assignedTo: 'Jane Smith',
    startDate: '2024-01-10',
    endDate: '2024-07-15',
    lastUpdated: '2024-04-20'
  },
  { 
    id: 3, 
    name: 'CRM Integration', 
    status: 'On Hold', 
    progress: 30, 
    assignedTo: 'Mark Johnson',
    startDate: '2023-12-05',
    endDate: '2024-06-20',
    lastUpdated: '2024-03-15'
  },
  { 
    id: 4, 
    name: 'Brand Redesign', 
    status: 'Completed', 
    progress: 100, 
    assignedTo: 'Emily Clark',
    startDate: '2023-09-01',
    endDate: '2024-02-28',
    lastUpdated: '2024-02-28'
  },
  { 
    id: 5, 
    name: 'Marketing Campaign', 
    status: 'Ongoing', 
    progress: 60, 
    assignedTo: 'Sarah Wilson',
    startDate: '2024-02-15',
    endDate: '2024-06-10',
    lastUpdated: '2024-04-18'
  },
  { 
    id: 6, 
    name: 'Data Migration', 
    status: 'Completed', 
    progress: 100, 
    assignedTo: 'James Brown',
    startDate: '2023-11-20',
    endDate: '2024-03-10',
    lastUpdated: '2024-03-10'
  }
]);

// Filter projects by status
const ongoingProjects = computed(() => projectsData.value.filter(p => p.status === 'Ongoing'));
const completedProjects = computed(() => projectsData.value.filter(p => p.status === 'Completed'));
const onHoldProjects = computed(() => projectsData.value.filter(p => p.status === 'On Hold'));

// Summary stats
const totalProjects = computed(() => projectsData.value.length);
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
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-neutral-900 mb-6">Dashboard</h1>
    
    <!-- Stats Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Total Projects -->
      <div class="bg-white p-4 rounded-lg shadow-card">
        <div class="flex items-center mb-2">
          <div class="w-10 h-10 rounded-md bg-primary-100 flex items-center justify-center text-primary-600">
            <span class="mdi mdi-folder-multiple text-xl"></span>
          </div>
          <h3 class="ml-3 text-lg font-medium text-neutral-700">Total Projects</h3>
        </div>
        <p class="text-3xl font-bold text-neutral-900">{{ totalProjects }}</p>
        <div class="mt-2 flex items-center text-sm text-neutral-500">
          <span class="flex items-center">
            <span class="mdi mdi-information-outline mr-1"></span>
            All time projects
          </span>
        </div>
      </div>
      
      <!-- Ongoing Projects -->
      <div class="bg-white p-4 rounded-lg shadow-card">
        <div class="flex items-center mb-2">
          <div class="w-10 h-10 rounded-md bg-accent-100 flex items-center justify-center text-accent-600">
            <span class="mdi mdi-clock-outline text-xl"></span>
          </div>
          <h3 class="ml-3 text-lg font-medium text-neutral-700">Ongoing</h3>
        </div>
        <p class="text-3xl font-bold text-neutral-900">{{ ongoingCount }}</p>
        <div class="mt-2 flex items-center text-sm text-neutral-500">
          <span class="flex items-center">
            <span class="mdi mdi-chart-line mr-1"></span>
            Avg. Progress: {{ averageProgress }}%
          </span>
        </div>
      </div>
      
      <!-- Completed Projects -->
      <div class="bg-white p-4 rounded-lg shadow-card">
        <div class="flex items-center mb-2">
          <div class="w-10 h-10 rounded-md bg-success-100 flex items-center justify-center text-success-600">
            <span class="mdi mdi-check-circle-outline text-xl"></span>
          </div>
          <h3 class="ml-3 text-lg font-medium text-neutral-700">Completed</h3>
        </div>
        <p class="text-3xl font-bold text-neutral-900">{{ completedCount }}</p>
        <div class="mt-2 flex items-center text-sm text-neutral-500">
          <span class="flex items-center">
            <span class="mdi mdi-percent mr-1"></span>
            {{ completionPercentage }}% completion rate
          </span>
        </div>
      </div>
      
      <!-- On Hold Projects -->
      <div class="bg-white p-4 rounded-lg shadow-card">
        <div class="flex items-center mb-2">
          <div class="w-10 h-10 rounded-md bg-warning-100 flex items-center justify-center text-warning-600">
            <span class="mdi mdi-pause-circle-outline text-xl"></span>
          </div>
          <h3 class="ml-3 text-lg font-medium text-neutral-700">On Hold</h3>
        </div>
        <p class="text-3xl font-bold text-neutral-900">{{ onHoldCount }}</p>
        <div class="mt-2 flex items-center text-sm text-neutral-500">
          <span class="flex items-center">
            <span class="mdi mdi-alert-outline mr-1"></span>
            Requires attention
          </span>
        </div>
      </div>
    </div>
    
    <!-- Projects Section -->
    <div class="mb-8">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-neutral-800">Ongoing Projects</h2>
        <a href="/projects" class="text-primary-600 hover:text-primary-700 text-sm flex items-center">
          View all
          <span class="mdi mdi-chevron-right ml-1"></span>
        </a>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="project in ongoingProjects.slice(0, 3)" :key="project.id" class="bg-white rounded-lg shadow-card overflow-hidden">
          <div class="p-4">
            <div class="flex justify-between items-start mb-3">
              <h3 class="font-medium text-lg text-neutral-900 truncate">{{ project.name }}</h3>
              <span class="px-2 py-1 text-xs rounded-full bg-accent-100 text-accent-700">{{ project.status }}</span>
            </div>
            
            <div class="mb-4">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-neutral-600">Progress</span>
                <span class="font-medium">{{ project.progress }}%</span>
              </div>
              <div class="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  class="bg-primary-600 h-2 rounded-full" 
                  :style="`width: ${project.progress}%`"
                ></div>
              </div>
            </div>
            
            <div class="text-sm text-neutral-600">
              <div class="flex items-center mb-2">
                <span class="mdi mdi-account text-lg mr-2"></span>
                <span>{{ project.assignedTo }}</span>
              </div>
              <div class="flex items-center mb-2">
                <span class="mdi mdi-calendar text-lg mr-2"></span>
                <span>{{ project.startDate }} - {{ project.endDate }}</span>
              </div>
              <div class="flex items-center">
                <span class="mdi mdi-clock-outline text-lg mr-2"></span>
                <span>Last updated: {{ project.lastUpdated }}</span>
              </div>
            </div>
          </div>
          
          <div class="border-t border-neutral-200 p-3 bg-neutral-50 flex justify-between">
            <a href="#" class="text-sm text-primary-600 hover:text-primary-700 flex items-center">
              <span class="mdi mdi-eye mr-1"></span>
              View details
            </a>
            <a href="#" class="text-sm text-primary-600 hover:text-primary-700 flex items-center">
              <span class="mdi mdi-pencil mr-1"></span>
              Update
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Recently Completed Projects -->
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-neutral-800">Recently Completed</h2>
        <a href="/projects?status=completed" class="text-primary-600 hover:text-primary-700 text-sm flex items-center">
          View all
          <span class="mdi mdi-chevron-right ml-1"></span>
        </a>
      </div>
      
      <div class="bg-white rounded-lg shadow-card overflow-hidden">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Project Name
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                Assigned To
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                End Date
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            <tr v-for="project in completedProjects" :key="project.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-neutral-900">{{ project.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                <div class="text-sm text-neutral-700">{{ project.assignedTo }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                <div class="text-sm text-neutral-700">{{ project.endDate }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-100 text-success-800">
                  {{ project.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a href="#" class="text-primary-600 hover:text-primary-700">View</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>