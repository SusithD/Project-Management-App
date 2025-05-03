<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Define layout
definePageMeta({
  layout: 'dashboard'
});

const route = useRoute();
const router = useRouter();
const projectId = route.params.id;
const isLoading = ref(true);
const project = ref(null);

// Sample data - in a real app this would come from an API
const projectsData = [
  { 
    id: '1', 
    name: 'Website Redesign', 
    status: 'Ongoing', 
    progress: 75, 
    assignedTo: 'John Doe',
    startDate: '2023-10-15',
    endDate: '2024-05-30',
    lastUpdated: '2024-04-22',
    remarks: 'Frontend development is 80% complete. Backend integration to start next week.',
    notes: 'Client requested additional features for the user dashboard. Need to adjust timeline.',
    team: ['John Doe', 'Jane Smith', 'Mike Johnson'],
    updates: [
      { date: '2024-04-22', author: 'John Doe', content: 'Completed all frontend components. Ready for integration testing.' },
      { date: '2024-04-15', author: 'Jane Smith', content: 'Backend API endpoints 90% complete. Documentation in progress.' },
      { date: '2024-04-08', author: 'John Doe', content: 'Started work on responsive design implementation.' }
    ],
    files: [
      { name: 'requirements_doc.pdf', size: '2.4 MB', uploadedOn: '2023-10-15', uploadedBy: 'Sarah Wilson' },
      { name: 'wireframes_v2.zip', size: '15.8 MB', uploadedOn: '2023-11-02', uploadedBy: 'John Doe' },
      { name: 'progress_report_q1.xlsx', size: '1.2 MB', uploadedOn: '2024-01-15', uploadedBy: 'John Doe' }
    ]
  },
  { 
    id: '2', 
    name: 'Mobile App Development', 
    status: 'Ongoing', 
    progress: 45, 
    assignedTo: 'Jane Smith',
    startDate: '2024-01-10',
    endDate: '2024-07-15',
    lastUpdated: '2024-04-20',
    remarks: 'UI design completed. Development in progress.',
    notes: 'Need to follow up with client regarding app store requirements.',
    team: ['Jane Smith', 'Robert Davis', 'Emily Clark'],
    updates: [
      { date: '2024-04-20', author: 'Jane Smith', content: 'Completed UI implementation for user profiles. Moving to notification system.' },
      { date: '2024-04-12', author: 'Robert Davis', content: 'Set up CI/CD pipeline for testing builds.' },
      { date: '2024-04-05', author: 'Emily Clark', content: 'Finalized design system and component library.' }
    ],
    files: [
      { name: 'app_mockups.sketch', size: '24.5 MB', uploadedOn: '2024-01-15', uploadedBy: 'Emily Clark' },
      { name: 'api_documentation.pdf', size: '3.2 MB', uploadedOn: '2024-02-10', uploadedBy: 'Robert Davis' },
      { name: 'test_plan.docx', size: '1.8 MB', uploadedOn: '2024-03-05', uploadedBy: 'Jane Smith' }
    ]
  }
];

// Fetch project data
onMounted(() => {
  // Simulate API call
  setTimeout(() => {
    const foundProject = projectsData.find(p => p.id === projectId);
    if (foundProject) {
      project.value = foundProject;
    } else {
      router.push('/projects');
    }
    isLoading.value = false;
  }, 500);
});

// Active tab state
const activeTab = ref('overview');

// Handle file download
const downloadFile = (file) => {
  // In a real app, this would download the actual file
  alert(`Downloading ${file.name}...`);
};

// Calculate days remaining
const daysRemaining = computed(() => {
  if (!project.value) return 0;
  
  const endDate = new Date(project.value.endDate);
  const today = new Date();
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Check if project is overdue
const isOverdue = computed(() => {
  if (!project.value) return false;
  return daysRemaining.value < 0 && project.value.status !== 'Completed';
});

// Calculate progress status
const progressStatus = computed(() => {
  if (!project.value) return '';
  
  if (project.value.progress < 25) return 'At Risk';
  if (project.value.progress < 50) return 'Needs Attention';
  if (project.value.progress < 75) return 'On Track';
  return 'Good Progress';
});
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
    </div>
    
    <!-- Project Details -->
    <div v-else>
      <!-- Header with Actions -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-neutral-900">{{ project.name }}</h1>
            <span 
              :class="[
                'ml-4 px-3 py-1 text-xs font-medium rounded-full',
                project.status === 'Completed' ? 'bg-success-100 text-success-800' : 
                project.status === 'Ongoing' ? 'bg-accent-100 text-accent-800' : 
                'bg-warning-100 text-warning-800'
              ]"
            >
              {{ project.status }}
            </span>
          </div>
          <p class="text-neutral-600 mt-1">Project ID: {{ project.id }}</p>
        </div>
        
        <div class="flex mt-4 md:mt-0 space-x-3">
          <a 
            :href="`/projects/${project.id}/edit`"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
          >
            <span class="mdi mdi-pencil text-lg mr-2"></span>
            Edit Project
          </a>
          
          <button 
            v-if="project.status !== 'Completed'"
            class="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md bg-white text-neutral-700 hover:bg-neutral-50"
          >
            <span class="mdi mdi-check-circle text-lg mr-2 text-success-600"></span>
            Mark Completed
          </button>
        </div>
      </div>
      
      <!-- Progress Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- Progress Card -->
        <div class="bg-white rounded-lg shadow-card p-4">
          <h3 class="text-sm font-medium text-neutral-500 mb-2">Project Progress</h3>
          <div class="flex items-center mb-2">
            <div class="text-3xl font-bold text-neutral-900 mr-2">{{ project.progress }}%</div>
            <div 
              :class="[
                'text-sm font-medium px-2 py-1 rounded',
                project.progress >= 75 ? 'bg-success-100 text-success-700' : 
                project.progress >= 50 ? 'bg-accent-100 text-accent-700' :
                'bg-warning-100 text-warning-700'
              ]"
            >
              {{ progressStatus }}
            </div>
          </div>
          <div class="w-full bg-neutral-200 rounded-full h-3 mb-2">
            <div 
              :class="[
                'h-3 rounded-full',
                project.progress >= 75 ? 'bg-success-600' : 
                project.progress >= 50 ? 'bg-accent-600' :
                'bg-warning-600'
              ]"
              :style="`width: ${project.progress}%`"
            ></div>
          </div>
          <p class="text-sm text-neutral-600">Last updated: {{ project.lastUpdated }}</p>
        </div>
        
        <!-- Timeline Card -->
        <div class="bg-white rounded-lg shadow-card p-4">
          <h3 class="text-sm font-medium text-neutral-500 mb-2">Timeline</h3>
          <div class="flex items-center mb-2">
            <div class="text-3xl font-bold text-neutral-900 mr-2">{{ Math.abs(daysRemaining) }}</div>
            <div 
              :class="[
                'text-sm font-medium px-2 py-1 rounded',
                isOverdue ? 'bg-error-100 text-error-700' : 'bg-neutral-100 text-neutral-700'
              ]"
            >
              {{ isOverdue ? 'Days Overdue' : 'Days Remaining' }}
            </div>
          </div>
          <div class="text-sm text-neutral-600">
            <div class="flex items-center mb-1">
              <span class="mdi mdi-calendar-start text-lg mr-2 text-neutral-500"></span>
              Start: {{ project.startDate }}
            </div>
            <div class="flex items-center">
              <span class="mdi mdi-calendar-end text-lg mr-2 text-neutral-500"></span>
              Due: {{ project.endDate }}
            </div>
          </div>
        </div>
        
        <!-- Team Card -->
        <div class="bg-white rounded-lg shadow-card p-4">
          <h3 class="text-sm font-medium text-neutral-500 mb-2">Team</h3>
          <div class="flex items-center mb-3">
            <div class="text-lg font-medium text-neutral-900 mr-2">Assigned to:</div>
            <div class="text-lg text-neutral-800">{{ project.assignedTo }}</div>
          </div>
          <div class="text-sm text-neutral-600">
            <div class="font-medium mb-1">Team Members:</div>
            <div v-for="(member, index) in project.team" :key="index" class="flex items-center mb-1">
              <span class="mdi mdi-account text-lg mr-2 text-neutral-500"></span>
              {{ member }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tabs Navigation -->
      <div class="border-b border-neutral-200 mb-6">
        <nav class="flex space-x-8">
          <button 
            @click="activeTab = 'overview'"
            :class="[
              'py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
              activeTab === 'overview' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            ]"
          >
            Overview
          </button>
          <button 
            @click="activeTab = 'updates'"
            :class="[
              'py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
              activeTab === 'updates' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            ]"
          >
            Updates
          </button>
          <button 
            @click="activeTab = 'files'"
            :class="[
              'py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
              activeTab === 'files' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            ]"
          >
            Files
          </button>
        </nav>
      </div>
      
      <!-- Tab Content -->
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="bg-white rounded-lg shadow-card p-6">
        <h2 class="text-lg font-medium text-neutral-900 mb-4">Project Details</h2>
        
        <div class="mb-6">
          <h3 class="text-md font-medium text-neutral-800 mb-2">Remarks</h3>
          <p class="text-neutral-700 bg-neutral-50 p-3 rounded-md">{{ project.remarks }}</p>
        </div>
        
        <div class="mb-6">
          <h3 class="text-md font-medium text-neutral-800 mb-2">Notes</h3>
          <p class="text-neutral-700 bg-neutral-50 p-3 rounded-md">{{ project.notes }}</p>
        </div>
        
        <div>
          <h3 class="text-md font-medium text-neutral-800 mb-2">Project Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-neutral-50 p-3 rounded-md">
              <div class="flex justify-between mb-1">
                <span class="text-neutral-600">Status:</span>
                <span class="font-medium text-neutral-900">{{ project.status }}</span>
              </div>
              <div class="flex justify-between mb-1">
                <span class="text-neutral-600">Progress:</span>
                <span class="font-medium text-neutral-900">{{ project.progress }}%</span>
              </div>
              <div class="flex justify-between mb-1">
                <span class="text-neutral-600">Assigned To:</span>
                <span class="font-medium text-neutral-900">{{ project.assignedTo }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Team Size:</span>
                <span class="font-medium text-neutral-900">{{ project.team.length }} members</span>
              </div>
            </div>
            
            <div class="bg-neutral-50 p-3 rounded-md">
              <div class="flex justify-between mb-1">
                <span class="text-neutral-600">Start Date:</span>
                <span class="font-medium text-neutral-900">{{ project.startDate }}</span>
              </div>
              <div class="flex justify-between mb-1">
                <span class="text-neutral-600">End Date:</span>
                <span class="font-medium text-neutral-900">{{ project.endDate }}</span>
              </div>
              <div class="flex justify-between mb-1">
                <span class="text-neutral-600">Days Remaining:</span>
                <span 
                  :class="[
                    'font-medium',
                    isOverdue ? 'text-error-600' : 'text-neutral-900'
                  ]"
                >
                  {{ isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days` }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-600">Last Updated:</span>
                <span class="font-medium text-neutral-900">{{ project.lastUpdated }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Updates Tab -->
      <div v-if="activeTab === 'updates'" class="bg-white rounded-lg shadow-card p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-neutral-900">Project Updates</h2>
          <button class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700">
            <span class="mdi mdi-plus text-lg mr-1"></span>
            Add Update
          </button>
        </div>
        
        <div class="space-y-4">
          <div v-for="(update, index) in project.updates" :key="index" class="bg-neutral-50 p-4 rounded-md">
            <div class="flex justify-between items-start mb-2">
              <div>
                <span class="font-medium text-neutral-900">{{ update.author }}</span>
                <span class="text-neutral-500 text-sm ml-2">{{ update.date }}</span>
              </div>
            </div>
            <p class="text-neutral-700">{{ update.content }}</p>
          </div>
        </div>
      </div>
      
      <!-- Files Tab -->
      <div v-if="activeTab === 'files'" class="bg-white rounded-lg shadow-card p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-neutral-900">Project Files</h2>
          <button class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700">
            <span class="mdi mdi-upload text-lg mr-1"></span>
            Upload File
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-neutral-200">
            <thead class="bg-neutral-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  File Name
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Uploaded On
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Uploaded By
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-neutral-200">
              <tr v-for="(file, index) in project.files" :key="index" class="hover:bg-neutral-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span 
                      :class="[
                        'mdi text-xl mr-2',
                        file.name.endsWith('.pdf') ? 'mdi-file-pdf-box text-error-600' :
                        file.name.endsWith('.zip') ? 'mdi-zip-box text-primary-600' :
                        file.name.endsWith('.xlsx') ? 'mdi-file-excel text-success-600' :
                        file.name.endsWith('.docx') ? 'mdi-file-word text-primary-500' :
                        file.name.endsWith('.sketch') ? 'mdi-file-image text-accent-600' :
                        'mdi-file-document text-neutral-600'
                      ]"
                    ></span>
                    <span class="text-sm font-medium text-neutral-900">{{ file.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-neutral-700">{{ file.size }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-neutral-700">{{ file.uploadedOn }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-neutral-700">{{ file.uploadedBy }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="downloadFile(file)" class="text-primary-600 hover:text-primary-900 mr-3">
                    <span class="mdi mdi-download"></span>
                  </button>
                  <button class="text-neutral-600 hover:text-neutral-900">
                    <span class="mdi mdi-delete"></span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>