<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProjectsStore } from '~/stores/projects';
import NewProjectModal from '~/components/projects/NewProjectModal.vue';

// Define layout
definePageMeta({
  layout: 'dashboard'
});

// Get projects from store
const projectsStore = useProjectsStore();
const isNewProjectModalOpen = ref(false);

// Fetch projects on component mount
onMounted(async () => {
  await projectsStore.fetchProjects();
});

// Filters
const searchQuery = ref('');
const statusFilter = ref('all');
const assigneeFilter = ref('all');

// Get unique assignees for filter dropdown
const uniqueAssignees = computed(() => {
  const assignees = [...new Set(projectsStore.projects.map(p => p.assignedTo))];
  return assignees.sort();
});

// Filter projects based on search and filter criteria
const filteredProjects = computed(() => {
  return projectsStore.projects.filter(project => {
    // Apply search filter
    const matchesSearch = searchQuery.value === '' ||
      project.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (project.remarks && project.remarks.toLowerCase().includes(searchQuery.value.toLowerCase()));
    
    // Apply status filter
    const matchesStatus = statusFilter.value === 'all' || project.status === statusFilter.value;
    
    // Apply assignee filter
    const matchesAssignee = assigneeFilter.value === 'all' || project.assignedTo === assigneeFilter.value;
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });
});

// Handle export to Excel
const exportToExcel = () => {
  // In a real app, this would use xlsx or similar library to generate Excel file
  alert('Exporting to Excel...');
};

// Handle export to PDF
const exportToPDF = () => {
  // In a real app, this would use jspdf or similar library to generate PDF
  alert('Exporting to PDF...');
};

// Open new project modal
const openNewProjectModal = () => {
  isNewProjectModalOpen.value = true;
};

// Close new project modal
const closeNewProjectModal = () => {
  isNewProjectModalOpen.value = false;
};
</script>

<template>
  <div>
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <h1 class="text-2xl font-bold text-neutral-900 mb-4 md:mb-0">Projects</h1>
      
      <div class="flex flex-wrap gap-2">
        <button 
          @click="exportToExcel"
          class="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md bg-white text-neutral-700 hover:bg-neutral-50"
        >
          <span class="mdi mdi-microsoft-excel text-lg mr-2 text-success-600"></span>
          Export to Excel
        </button>
        
        <button 
          @click="exportToPDF"
          class="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md bg-white text-neutral-700 hover:bg-neutral-50"
        >
          <span class="mdi mdi-file-pdf-box text-lg mr-2 text-error-600"></span>
          Export to PDF
        </button>
        
        <button 
          @click="openNewProjectModal"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
        >
          <span class="mdi mdi-plus text-lg mr-2"></span>
          Add Project
        </button>
      </div>
    </div>
    
    <!-- Filters Section -->
    <div class="bg-white rounded-lg shadow-card p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search Box -->
        <div>
          <label for="search" class="block text-sm font-medium text-neutral-700 mb-1">Search</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              <span class="mdi mdi-magnify text-lg"></span>
            </span>
            <input 
              v-model="searchQuery"
              type="text" 
              id="search"
              placeholder="Search projects..." 
              class="w-full pl-10 pr-4 py-2 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
          </div>
        </div>
        
        <!-- Status Filter -->
        <div>
          <label for="status" class="block text-sm font-medium text-neutral-700 mb-1">Status</label>
          <select 
            v-model="statusFilter"
            id="status"
            class="w-full py-2 px-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
        
        <!-- Assignee Filter -->
        <div>
          <label for="assignee" class="block text-sm font-medium text-neutral-700 mb-1">Assigned To</label>
          <select 
            v-model="assigneeFilter"
            id="assignee"
            class="w-full py-2 px-3 rounded-md bg-white border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Assignees</option>
            <option v-for="assignee in uniqueAssignees" :key="assignee" :value="assignee">
              {{ assignee }}
            </option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Projects List -->
    <div class="bg-white rounded-lg shadow-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Project Name
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Progress
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                Assigned To
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                Dates
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                Last Updated
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            <tr v-for="project in filteredProjects" :key="project.id" class="hover:bg-neutral-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-neutral-900">{{ project.name }}</div>
                <div class="text-xs text-neutral-500 mt-1 lg:hidden truncate max-w-[200px]">{{ project.remarks }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  :class="[
                    'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                    project.status === 'Completed' ? 'bg-success-100 text-success-800' : 
                    project.status === 'Ongoing' ? 'bg-accent-100 text-accent-800' : 
                    'bg-warning-100 text-warning-800'
                  ]"
                >
                  {{ project.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-full bg-neutral-200 rounded-full h-2 mr-2 max-w-[100px]">
                    <div 
                      :class="[
                        'h-2 rounded-full',
                        project.progress >= 80 ? 'bg-success-600' : 
                        project.progress >= 40 ? 'bg-accent-600' : 'bg-warning-600'
                      ]"
                      :style="`width: ${project.progress}%`"
                    ></div>
                  </div>
                  <span class="text-xs font-medium text-neutral-700">{{ project.progress }}%</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                <div class="text-sm text-neutral-700">{{ project.assignedTo }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                <div class="text-sm text-neutral-700">{{ project.startDate }} - {{ project.endDate }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                <div class="text-sm text-neutral-700">{{ project.lastUpdated }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <a :href="`/projects/${project.id}`" class="text-primary-600 hover:text-primary-900 mr-4">View</a>
                <a :href="`/projects/${project.id}/edit`" class="text-primary-600 hover:text-primary-900">Edit</a>
              </td>
            </tr>
            <tr v-if="filteredProjects.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-sm text-neutral-500">
                <div class="flex flex-col items-center">
                  <span class="mdi mdi-folder-search-outline text-4xl text-neutral-400 mb-2"></span>
                  No projects found matching your filters.
                  <button @click="searchQuery = ''; statusFilter = 'all'; assigneeFilter = 'all'" class="mt-2 text-primary-600 hover:text-primary-700">
                    Clear filters
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="bg-neutral-50 px-6 py-3 border-t border-neutral-200 text-sm text-neutral-500">
        Showing {{ filteredProjects.length }} of {{ projectsStore.projects.length }} projects
      </div>
    </div>
    
    <!-- New Project Modal -->
    <NewProjectModal 
      :is-open="isNewProjectModalOpen" 
      @close="closeNewProjectModal"
    />
  </div>
</template>