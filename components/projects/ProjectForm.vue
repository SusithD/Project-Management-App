<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      name: '',
      status: 'Ongoing',
      progress: 0,
      assignedTo: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      remarks: '',
      notes: '',
      priority: 'Medium',
      category: '',
      team: [],
      // New fields
      company: '',
      statusPhase: '',
      deadline: '',
      comments: '',
      developers: [],
      blockers: '',
      responsiblePerson: '',
      initiallyRaisedOn: new Date().toISOString().split('T')[0],
      pendingDays: 0,
      feedbackForBlockers: ''
    })
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'cancel']);

// Form data
const formData = ref({...props.initialData});

// Animation states
const isProgressHovered = ref(false);
const activeSections = ref({
  basicInfo: true,
  timeline: false,
  teamInfo: false,
  additional: false,
  projectDetails: false // New section for the new fields
});

// Section transitions
const sectionTransitions = ref({
  basicInfo: false,
  timeline: false,
  teamInfo: false,
  additional: false,
  projectDetails: false
});

// Visual enhancements
const activeTab = ref('info'); // For tabs in certain sections
const showFormValidationTip = ref(false);
const formSubmitAttempted = ref(false);

// Team members (in a real app, this would come from an API)
const teamMembers = [
  'John Doe',
  'Jane Smith',
  'Robert Johnson',
  'Sarah Williams',
  'Michael Brown'
];

// Project status options
const statusOptions = ['Ongoing', 'Completed', 'On Hold'];

// Priority options
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

// Category options
const categoryOptions = ['Development', 'Design', 'Marketing', 'Research', 'Support', 'Other'];

// Status Phase options
const statusPhaseOptions = ['Planning', 'Development', 'Testing', 'Deployment', 'Maintenance'];

// Toggle section visibility with animation
const toggleSection = (section) => {
  activeSections.value[section] = !activeSections.value[section];
  
  // Enable transition effect
  sectionTransitions.value[section] = true;
  
  // If opening a section, scroll to it
  if (activeSections.value[section]) {
    setTimeout(() => {
      document.getElementById(`section-${section}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }
};

// Switch tabs within sections
const switchTab = (tab) => {
  activeTab.value = tab;
};

// Get priority badge color
const priorityColor = computed(() => {
  const priority = formData.value.priority;
  switch(priority) {
    case 'Urgent': return 'bg-red-100 text-red-800';
    case 'High': return 'bg-orange-100 text-orange-800';
    case 'Medium': return 'bg-blue-100 text-blue-800';
    case 'Low': return 'bg-green-100 text-green-800';
    default: return 'bg-neutral-100 text-neutral-800';
  }
});

// Get status badge color
const statusColor = computed(() => {
  const status = formData.value.status;
  switch(status) {
    case 'Completed': return 'bg-green-100 text-green-800';
    case 'Ongoing': return 'bg-blue-100 text-blue-800';
    case 'On Hold': return 'bg-amber-100 text-amber-800';
    default: return 'bg-neutral-100 text-neutral-800';
  }
});

// Get progress color based on value
const progressColor = computed(() => {
  const progress = formData.value.progress;
  if (progress >= 75) return 'bg-success-600';
  if (progress >= 40) return 'bg-accent-600';
  return 'bg-warning-600';
});

// Computed validation states with more detailed feedback
const fieldValidation = computed(() => {
  return {
    name: !!formData.value.name,
    assignedTo: !!formData.value.assignedTo,
    startDate: !!formData.value.startDate,
    endDate: !!formData.value.endDate,
    category: !!formData.value.category,
    priority: !!formData.value.priority
  };
});

// Computed validation states
const isFormValid = computed(() => {
  return Object.values(fieldValidation.value).every(valid => valid);
});

// Invalid fields for showing error messages
const invalidFields = computed(() => {
  if (!formSubmitAttempted.value) return [];
  
  return Object.entries(fieldValidation.value)
    .filter(([_, isValid]) => !isValid)
    .map(([field]) => field);
});

// Calculate estimated days
const estimatedDays = computed(() => {
  if (!formData.value.startDate || !formData.value.endDate) return 0;
  
  const start = new Date(formData.value.startDate);
  const end = new Date(formData.value.endDate);
  
  // Return difference in days
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
});

// Calculate pending days (from initially raised date to current date)
const calculatePendingDays = () => {
  if (formData.value.initiallyRaisedOn) {
    const initialDate = new Date(formData.value.initiallyRaisedOn);
    const currentDate = new Date();
    formData.value.pendingDays = Math.ceil((currentDate - initialDate) / (1000 * 60 * 60 * 24));
  }
};

// Show form validation tip with delay
const showValidationTip = () => {
  formSubmitAttempted.value = true;
  showFormValidationTip.value = true;
  setTimeout(() => {
    showFormValidationTip.value = false;
  }, 3000);
};

// Watch for changes in initiallyRaisedOn to update pendingDays
watch(() => formData.value.initiallyRaisedOn, calculatePendingDays);

// Initialize component
onMounted(() => {
  // Calculate pending days on initial load
  calculatePendingDays();
  
  // Set initial section transitions to true after mounting
  setTimeout(() => {
    Object.keys(sectionTransitions.value).forEach(key => {
      sectionTransitions.value[key] = true;
    });
  }, 100);
});

// Handle form submission
const handleSubmit = () => {
  if (isFormValid.value) {
    calculatePendingDays(); // Ensure pending days is calculated
    emit('submit', {...formData.value});
  } else {
    showValidationTip();
  }
};

// Handle cancel
const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-8 max-w-6xl mx-auto">
    <!-- Basic Information Section -->
    <div id="section-basicInfo" class="bg-white rounded-lg shadow-md border border-neutral-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div 
        class="flex items-center justify-between cursor-pointer p-5 bg-gradient-to-r from-white to-neutral-50" 
        @click="toggleSection('basicInfo')"
      >
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span class="mdi mdi-information-outline text-xl text-primary-600"></span>
          </div>
          <div>
            <h3 class="text-lg font-medium text-neutral-800">Basic Information</h3>
            <p class="text-xs text-neutral-500 hidden sm:block">Project name, category, status, and priority</p>
          </div>
        </div>
        <span 
          :class="['mdi text-xl transition-transform duration-300', 
                  activeSections.basicInfo ? 'mdi-chevron-up transform rotate-0' : 'mdi-chevron-down transform rotate-0']"
        ></span>
      </div>
      
      <div 
        v-show="activeSections.basicInfo" 
        :class="['p-6 space-y-6 border-t border-neutral-100 bg-white transition-all duration-300', 
                 sectionTransitions.basicInfo ? 'opacity-100 max-h-1000px' : 'opacity-0 max-h-0']"
      >
        <!-- Project Name -->
        <div class="transition-all duration-200 hover:bg-neutral-50 p-4 rounded-md -mx-3">
          <label for="project-name" class="block text-sm font-medium text-neutral-700">Project Name</label>
          <div class="relative mt-1">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-500">
              <span class="mdi mdi-folder-outline"></span>
            </span>
            <input
              id="project-name"
              v-model="formData.name"
              type="text"
              placeholder="Enter project name"
              :class="['pl-10 block w-full rounded-md border px-3 py-2.5 shadow-sm transition-all duration-200 focus:ring-2',
                       invalidFields.includes('name') && formSubmitAttempted ? 
                       'border-red-300 focus:border-red-500 focus:ring-red-200' : 
                       'border-neutral-300 focus:border-primary-500 focus:ring-primary-200']"
              required
            />
            <span v-if="invalidFields.includes('name') && formSubmitAttempted" class="text-xs text-red-500 mt-1 block">
              Project name is required
            </span>
          </div>
        </div>
        
        <!-- Category & Status: Three columns on wide screens -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Category -->
          <div class="transition-all duration-200 hover:bg-neutral-50 p-4 rounded-md -mx-3">
            <label for="project-category" class="block text-sm font-medium text-neutral-700">Category</label>
            <div class="relative mt-1">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-500">
                <span class="mdi mdi-shape-outline"></span>
              </span>
              <select
                id="project-category"
                v-model="formData.category"
                :class="['pl-10 block w-full rounded-md border px-3 py-2.5 shadow-sm appearance-none transition-all duration-200 focus:ring-2',
                         invalidFields.includes('category') && formSubmitAttempted ? 
                         'border-red-300 focus:border-red-500 focus:ring-red-200' : 
                         'border-neutral-300 focus:border-primary-500 focus:ring-primary-200']"
                required
              >
                <option value="" disabled>Select category</option>
                <option v-for="category in categoryOptions" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                <span class="mdi mdi-chevron-down text-lg"></span>
              </div>
              <span v-if="invalidFields.includes('category') && formSubmitAttempted" class="text-xs text-red-500 mt-1 block">
                Category is required
              </span>
            </div>
          </div>
          
          <!-- Status -->
          <div class="transition-all duration-200 hover:bg-neutral-50 p-4 rounded-md -mx-3">
            <label for="project-status" class="block text-sm font-medium text-neutral-700">Status</label>
            <div class="relative mt-1">
              <div class="flex">
                <div v-for="status in statusOptions" :key="status" class="flex-1">
                  <input 
                    type="radio" 
                    :id="`status-${status}`" 
                    :value="status" 
                    v-model="formData.status"
                    class="sr-only peer"
                  />
                  <label 
                    :for="`status-${status}`" 
                    :class="[
                      'block text-center py-2 px-1 text-sm border rounded-md cursor-pointer transition-all duration-200 truncate',
                      formData.status === status ? 
                        'bg-primary-50 border-primary-500 text-primary-700 font-medium shadow-sm' : 
                        'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    ]"
                  >
                    {{ status }}
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Priority moved to same row for better layout on wider screens -->
          <div class="transition-all duration-200 hover:bg-neutral-50 p-4 rounded-md -mx-3">
            <label class="block text-sm font-medium text-neutral-700 mb-2">Priority</label>
            <div class="flex flex-wrap gap-2">
              <template v-for="priority in priorityOptions" :key="priority">
                <input 
                  type="radio" 
                  :id="`priority-${priority}`" 
                  :value="priority" 
                  v-model="formData.priority"
                  class="sr-only peer" 
                  :required="priority === 'Medium'"
                />
                <label 
                  :for="`priority-${priority}`" 
                  :class="[
                    'inline-flex items-center gap-1 px-3 py-1 rounded-full cursor-pointer text-sm transition-all duration-200',
                    formData.priority === priority ? 
                      (priority === 'Urgent' ? 'bg-red-100 text-red-800 border border-red-300' :
                       priority === 'High' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                       priority === 'Medium' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                       'bg-green-100 text-green-800 border border-green-300') : 
                      'bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-50'
                  ]"
                >
                  <span class="mdi" 
                    :class="[
                      priority === 'Urgent' ? 'mdi-alert-circle' :
                      priority === 'High' ? 'mdi-arrow-up-bold' :
                      priority === 'Medium' ? 'mdi-minus' :
                      'mdi-arrow-down-bold'
                    ]"
                  ></span>
                  {{ priority }}
                </label>
              </template>
            </div>
            <span v-if="invalidFields.includes('priority') && formSubmitAttempted" class="text-xs text-red-500 mt-1 block">
              Priority is required
            </span>
          </div>
        </div>
        
        <!-- Progress with enhanced interaction - expanded for wider form -->
        <div class="bg-neutral-50 rounded-md p-5 transition-all duration-200 hover:bg-neutral-100">
          <div class="flex justify-between items-center mb-3">
            <label for="project-progress" class="block text-sm font-medium text-neutral-700 flex items-center gap-2">
              <span class="mdi mdi-chart-line text-lg text-primary-600"></span>
              Progress
            </label>
            <span 
              :class="[
                'text-xs font-medium py-1 px-4 rounded-full transition-all duration-300', 
                formData.progress >= 75 ? 'bg-success-100 text-success-800' : 
                formData.progress >= 40 ? 'bg-accent-100 text-accent-800' : 
                'bg-warning-100 text-warning-800'
              ]"
            >
              {{ formData.progress }}%
            </span>
          </div>
          <div class="mt-2 relative">
            <div class="w-full bg-neutral-200 rounded-full h-4 mb-2 overflow-hidden">
              <div 
                :class="['h-4 rounded-full transition-all duration-300', progressColor]"
                :style="`width: ${formData.progress}%`"
              ></div>
            </div>
            <input
              id="project-progress"
              v-model="formData.progress"
              @mouseenter="isProgressHovered = true"
              @mouseleave="isProgressHovered = false"
              type="range"
              min="0"
              max="100"
              step="5"
              class="absolute top-0 left-0 w-full opacity-0 cursor-pointer h-4"
            />
            <!-- Progress markers -->
            <div class="flex justify-between text-xs text-neutral-500 mt-2 px-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Timeline Section -->
    <div id="section-timeline" class="bg-white rounded-lg shadow-md border border-neutral-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div 
        class="flex items-center justify-between cursor-pointer p-5 bg-gradient-to-r from-white to-neutral-50" 
        @click="toggleSection('timeline')"
      >
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span class="mdi mdi-calendar-range text-xl text-primary-600"></span>
          </div>
          <div>
            <h3 class="text-lg font-medium text-neutral-800">Timeline</h3>
            <p class="text-xs text-neutral-500 hidden sm:block">Project start and end dates, duration</p>
          </div>
        </div>
        <span 
          :class="['mdi text-xl transition-transform duration-300', 
                  activeSections.timeline ? 'mdi-chevron-up transform rotate-0' : 'mdi-chevron-down transform rotate-0']"
        ></span>
      </div>
      
      <div 
        v-show="activeSections.timeline" 
        :class="['p-6 space-y-6 border-t border-neutral-100 bg-white transition-all duration-300', 
                 sectionTransitions.timeline ? 'opacity-100 max-h-500px' : 'opacity-0 max-h-0']"
      >
        <!-- Calendar View -->
        <div class="bg-neutral-50 p-5 rounded-lg border border-neutral-200 mb-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-neutral-800">Project Timeline</h4>
            <span class="text-xs text-primary-600 font-medium">{{ estimatedDays }} days</span>
          </div>
          
          <!-- Start & End Date: Three columns on wider screens -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Start Date -->
            <div class="transition-all duration-200 hover:bg-white rounded-md p-3">
              <label for="project-start-date" class="block text-sm font-medium text-neutral-700 flex items-center gap-1">
                <span class="mdi mdi-calendar-start text-primary-600"></span>
                Start Date
              </label>
              <div class="relative mt-1">
                <input
                  id="project-start-date"
                  v-model="formData.startDate"
                  type="date"
                  :class="['block w-full rounded-md border px-3 py-2 shadow-sm transition-all duration-200 focus:ring-2',
                           invalidFields.includes('startDate') && formSubmitAttempted ? 
                           'border-red-300 focus:border-red-500 focus:ring-red-200' : 
                           'border-neutral-300 focus:border-primary-500 focus:ring-primary-200']"
                  required
                />
                <span v-if="invalidFields.includes('startDate') && formSubmitAttempted" class="text-xs text-red-500 mt-1 block">
                  Start date is required
                </span>
              </div>
            </div>
            
            <!-- End Date -->
            <div class="transition-all duration-200 hover:bg-white rounded-md p-3">
              <label for="project-end-date" class="block text-sm font-medium text-neutral-700 flex items-center gap-1">
                <span class="mdi mdi-calendar-end text-primary-600"></span>
                End Date
              </label>
              <div class="relative mt-1">
                <input
                  id="project-end-date"
                  v-model="formData.endDate"
                  type="date"
                  :class="['block w-full rounded-md border px-3 py-2 shadow-sm transition-all duration-200 focus:ring-2',
                           invalidFields.includes('endDate') && formSubmitAttempted ? 
                           'border-red-300 focus:border-red-500 focus:ring-red-200' : 
                           'border-neutral-300 focus:border-primary-500 focus:ring-primary-200']"
                  required
                />
                <span v-if="invalidFields.includes('endDate') && formSubmitAttempted" class="text-xs text-red-500 mt-1 block">
                  End date is required
                </span>
              </div>
            </div>
            
            <!-- Estimated Duration - moved to same row for better layout -->
            <div class="transition-all duration-200 hover:bg-white rounded-md p-3 flex flex-col justify-center">
              <label class="block text-sm font-medium text-neutral-700 mb-2">Estimated Duration</label>
              <div class="inline-flex items-center gap-2 px-4 py-3 bg-white border border-neutral-200 rounded-md">
                <span class="mdi mdi-calendar-clock text-primary-600"></span>
                <span class="text-base font-medium">{{ estimatedDays }} days</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Timeline visualization - enhanced for wider form -->
        <div class="relative pt-8 pb-4" v-if="formData.startDate && formData.endDate">
          <div class="absolute left-0 right-0 top-0 flex justify-between px-6">
            <div class="text-sm text-neutral-500">Start</div>
            <div class="text-sm text-neutral-500">End</div>
          </div>
          <div class="h-5 bg-neutral-100 rounded-full overflow-hidden relative">
            <div
              class="absolute h-full bg-primary-500 rounded-full"
              style="left: 0%; width: 100%;"
            ></div>
          </div>
          <div class="flex justify-between mt-3">
            <div class="text-sm font-medium">{{ formData.startDate }}</div>
            <div class="text-sm font-medium">{{ formData.endDate }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Team Information Section -->
    <div id="section-teamInfo" class="bg-white rounded-lg shadow-md border border-neutral-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div 
        class="flex items-center justify-between cursor-pointer p-5 bg-gradient-to-r from-white to-neutral-50" 
        @click="toggleSection('teamInfo')"
      >
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span class="mdi mdi-account-group text-xl text-primary-600"></span>
          </div>
          <div>
            <h3 class="text-lg font-medium text-neutral-800">Team Information</h3>
            <p class="text-xs text-neutral-500 hidden sm:block">Project lead and team members</p>
          </div>
        </div>
        <span 
          :class="['mdi text-xl transition-transform duration-300', 
                  activeSections.teamInfo ? 'mdi-chevron-up transform rotate-0' : 'mdi-chevron-down transform rotate-0']"
        ></span>
      </div>
      
      <div 
        v-show="activeSections.teamInfo" 
        :class="['p-6 space-y-6 border-t border-neutral-100 bg-white transition-all duration-300', 
                 sectionTransitions.teamInfo ? 'opacity-100 max-h-800px' : 'opacity-0 max-h-0']"
      >
        <!-- Assigned To -->
        <div class="transition-all duration-200 hover:bg-neutral-50 p-4 rounded-md">
          <label for="project-assignee" class="block text-sm font-medium text-neutral-700">Project Lead</label>
          <div class="relative mt-3">
            <div class="flex flex-wrap gap-3">
              <div 
                v-for="member in teamMembers" 
                :key="member" 
                class="relative"
              >
                <input 
                  type="radio" 
                  :id="`lead-${member.replace(' ', '-')}`" 
                  :value="member" 
                  v-model="formData.assignedTo"
                  class="sr-only peer" 
                  required
                />
                <label 
                  :for="`lead-${member.replace(' ', '-')}`" 
                  :class="[
                    'inline-flex items-center px-4 py-2 rounded-full border cursor-pointer text-sm transition-all duration-200',
                    formData.assignedTo === member ? 
                      'bg-primary-50 text-primary-800 border-primary-200 shadow-sm' : 
                      'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  ]"
                >
                  <span class="mdi mdi-account-circle mr-2 text-lg"
                    :class="formData.assignedTo === member ? 'text-primary-500' : 'text-neutral-400'"
                  ></span>
                  {{ member }}
                </label>
              </div>
            </div>
            <span v-if="invalidFields.includes('assignedTo') && formSubmitAttempted" class="text-xs text-red-500 mt-2 block">
              Project lead is required
            </span>
          </div>
        </div>
        
        <!-- Team Members with modern checkbox style - updated for wider layout -->
        <div class="mt-6 bg-neutral-50 p-5 rounded-lg">
          <label class="block text-sm font-medium text-neutral-700 mb-4 flex items-center gap-2">
            <span class="mdi mdi-account-multiple text-primary-600"></span>
            Team Members
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div 
              v-for="member in teamMembers"
              :key="member"
              class="flex items-center space-x-3 p-3 hover:bg-white rounded-md transition-all duration-200"
            >
              <div class="relative inline-flex items-center">
                <input
                  :id="`team-member-${member.replace(' ', '-')}`"
                  type="checkbox"
                  :value="member"
                  v-model="formData.team"
                  class="h-4 w-4 opacity-0 absolute"
                />
                <div 
                  class="h-5 w-5 border rounded flex items-center justify-center"
                  :class="formData.team.includes(member) ? 'bg-primary-500 border-primary-500' : 'border-neutral-300'"
                >
                  <span 
                    v-if="formData.team.includes(member)" 
                    class="mdi mdi-check text-white text-sm"
                  ></span>
                </div>
                <label :for="`team-member-${member.replace(' ', '-')}`" class="ml-2 text-sm text-neutral-700 cursor-pointer">
                  {{ member }}
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Team summary - more room for badges on wider form -->
        <div class="bg-white border border-neutral-200 rounded-lg p-4 mt-5" v-if="formData.team.length > 0">
          <h4 class="text-sm font-medium text-neutral-700 mb-3">Team Summary</h4>
          <div class="flex flex-wrap gap-2">
            <div v-for="member in formData.team" :key="`badge-${member}`" 
              class="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
            >
              <span class="mdi mdi-account-circle"></span>
              {{ member }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Additional Info Section -->
    <div id="section-additional" class="bg-white rounded-lg shadow-md border border-neutral-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div 
        class="flex items-center justify-between cursor-pointer p-5 bg-gradient-to-r from-white to-neutral-50" 
        @click="toggleSection('additional')"
      >
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span class="mdi mdi-text-box-outline text-xl text-primary-600"></span>
          </div>
          <div>
            <h3 class="text-lg font-medium text-neutral-800">Additional Information</h3>
            <p class="text-xs text-neutral-500 hidden sm:block">Remarks and notes about the project</p>
          </div>
        </div>
        <span 
          :class="['mdi text-xl transition-transform duration-300', 
                  activeSections.additional ? 'mdi-chevron-up transform rotate-0' : 'mdi-chevron-down transform rotate-0']"
        ></span>
      </div>
      
      <div 
        v-show="activeSections.additional" 
        :class="['p-6 space-y-6 border-t border-neutral-100 bg-white transition-all duration-300', 
                 sectionTransitions.additional ? 'opacity-100 max-h-800px' : 'opacity-0 max-h-0']"
      >
        <!-- Tabs for Remarks and Notes - wider layout with more space -->
        <div class="border-b border-neutral-200">
          <div class="flex -mb-px">
            <button 
              type="button" 
              @click="switchTab('remarks')" 
              :class="[
                'py-2 px-4 text-sm font-medium border-b-2 focus:outline-none',
                activeTab === 'remarks' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
              ]"
            >
              <span class="mdi mdi-clipboard-text-outline mr-1"></span>
              Remarks
            </button>
            <button 
              type="button" 
              @click="switchTab('notes')" 
              :class="[
                'py-2 px-4 text-sm font-medium border-b-2 focus:outline-none',
                activeTab === 'notes' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
              ]"
            >
              <span class="mdi mdi-note-text-outline mr-1"></span>
              Notes
            </button>
          </div>
        </div>
        
        <!-- Remarks tab content - taller textareas for wider form -->
        <div v-show="activeTab === 'remarks'" class="transition-opacity duration-300">
          <div class="bg-neutral-50 rounded-lg p-5">
            <div class="relative">
              <textarea
                id="project-remarks"
                v-model="formData.remarks"
                rows="5"
                placeholder="Add project remarks..."
                class="block w-full rounded-md border border-neutral-300 px-5 py-4 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors resize-none"
              ></textarea>
              <span class="mdi mdi-message-text-outline absolute top-4 right-4 text-neutral-400 text-lg"></span>
            </div>
          </div>
        </div>
        
        <!-- Notes tab content - taller textareas for wider form -->
        <div v-show="activeTab === 'notes'" class="transition-opacity duration-300">
          <div class="bg-neutral-50 rounded-lg p-5">
            <div class="relative">
              <textarea
                id="project-notes"
                v-model="formData.notes"
                rows="5"
                placeholder="Add additional notes about this project..."
                class="block w-full rounded-md border border-neutral-300 px-5 py-4 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors resize-none"
              ></textarea>
              <span class="mdi mdi-notebook-outline absolute top-4 right-4 text-neutral-400 text-lg"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Project Details Section - New section for additional fields - enhanced for wider form -->
    <div id="section-projectDetails" class="bg-white rounded-lg shadow-md border border-neutral-100 overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div 
        class="flex items-center justify-between cursor-pointer p-5 bg-gradient-to-r from-white to-neutral-50" 
        @click="toggleSection('projectDetails')"
      >
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span class="mdi mdi-file-document-outline text-xl text-primary-600"></span>
          </div>
          <div>
            <h3 class="text-lg font-medium text-neutral-800">Project Details</h3>
            <p class="text-xs text-neutral-500 hidden sm:block">Company, phase, deadlines, blockers, and more</p>
          </div>
        </div>
        <span 
          :class="['mdi text-xl transition-transform duration-300', 
                  activeSections.projectDetails ? 'mdi-chevron-up transform rotate-0' : 'mdi-chevron-down transform rotate-0']"
        ></span>
      </div>
      
      <div 
        v-show="activeSections.projectDetails" 
        :class="['p-6 space-y-6 border-t border-neutral-100 bg-white transition-all duration-300', 
                 sectionTransitions.projectDetails ? 'opacity-100 max-h-2000px' : 'opacity-0 max-h-0']"
      >
        <!-- Company & Status Phase: Three columns on wide screens -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Company -->
          <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm border border-neutral-200">
            <label for="project-company" class="block text-sm font-medium text-neutral-700 flex items-center gap-2 mb-2">
              <span class="mdi mdi-office-building text-primary-600"></span>
              Company
            </label>
            <div class="relative">
              <input
                id="project-company"
                v-model="formData.company"
                type="text"
                placeholder="Enter company name"
                class="block w-full rounded-md border border-neutral-300 px-4 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-200"
              />
            </div>
          </div>
          
          <!-- Status Phase -->
          <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm border border-neutral-200">
            <label for="project-status-phase" class="block text-sm font-medium text-neutral-700 flex items-center gap-2 mb-2">
              <span class="mdi mdi-playlist-check text-primary-600"></span>
              Status Phase
            </label>
            <div class="relative">
              <select
                id="project-status-phase"
                v-model="formData.statusPhase"
                class="block w-full rounded-md border border-neutral-300 px-4 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-200 appearance-none"
              >
                <option value="" disabled>Select status phase</option>
                <option v-for="phase in statusPhaseOptions" :key="phase" :value="phase">
                  {{ phase }}
                </option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500">
                <span class="mdi mdi-chevron-down text-lg"></span>
              </div>
            </div>
          </div>
          
          <!-- Pending days indicator - moved to same row for better layout -->
          <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm border border-neutral-200">
            <label class="block text-sm font-medium text-neutral-700 flex items-center gap-2 mb-2">
              <span class="mdi mdi-calendar-clock text-primary-600"></span>
              Pending Days
            </label>
            <div class="flex items-center justify-between">
              <div class="inline-flex items-center gap-2 px-4 py-3 bg-white border border-neutral-200 rounded-md w-full justify-center">
                <span class="text-lg font-medium">{{ formData.pendingDays }}</span>
                <span class="text-xs text-neutral-500 italic">days</span>
              </div>
            </div>
            <p class="text-xs text-neutral-500 mt-2 text-center">Auto-calculated</p>
          </div>
        </div>
        
        <!-- Modern timeline card for deadline & raised date - two columns for wider layout-->
        <div class="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
          <h4 class="text-sm font-medium text-neutral-700 mb-4 flex items-center gap-2">
            <span class="mdi mdi-clock-time-four-outline text-primary-600"></span>
            Time Tracking
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Deadline -->
            <div class="transition-all duration-200 hover:bg-neutral-50 rounded-md p-4">
              <label for="project-deadline" class="block text-sm font-medium text-neutral-700">Deadline</label>
              <div class="relative mt-1">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-500">
                  <span class="mdi mdi-clock-alert-outline"></span>
                </span>
                <input
                  id="project-deadline"
                  v-model="formData.deadline"
                  type="date"
                  class="pl-10 block w-full rounded-md border border-neutral-300 px-3 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                />
              </div>
            </div>
            
            <!-- Initially Raised On -->
            <div class="transition-all duration-200 hover:bg-neutral-50 rounded-md p-4">
              <label for="project-raised-on" class="block text-sm font-medium text-neutral-700">Initially Raised On</label>
              <div class="relative mt-1">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-500">
                  <span class="mdi mdi-calendar-plus"></span>
                </span>
                <input
                  id="project-raised-on"
                  v-model="formData.initiallyRaisedOn"
                  type="date"
                  class="pl-10 block w-full rounded-md border border-neutral-300 px-3 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Responsible Person & Developers Card - enhanced for wider layout -->
        <div class="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
          <h4 class="text-sm font-medium text-neutral-700 mb-4">People</h4>
          
          <!-- Responsible Person with avatar style selection - more items per row -->
          <div class="mb-6">
            <label for="project-responsible" class="block text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
              <span class="mdi mdi-account-check text-primary-600"></span>
              Responsible Person
            </label>
            <div class="flex flex-wrap gap-4">
              <div 
                v-for="member in teamMembers"
                :key="`resp-${member}`"
                class="relative"
              >
                <input 
                  type="radio" 
                  :id="`resp-member-${member.replace(' ', '-')}`" 
                  :value="member" 
                  v-model="formData.responsiblePerson"
                  class="sr-only peer" 
                />
                <label 
                  :for="`resp-member-${member.replace(' ', '-')}`" 
                  :class="[
                    'flex flex-col items-center px-4 py-3 rounded-lg border cursor-pointer text-sm transition-all duration-200',
                    formData.responsiblePerson === member ? 
                      'bg-primary-50 text-primary-800 border-primary-300' : 
                      'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  ]"
                >
                  <div :class="[
                    'h-10 w-10 rounded-full flex items-center justify-center text-lg mb-1',
                    formData.responsiblePerson === member ? 'bg-primary-200 text-primary-700' : 'bg-neutral-100 text-neutral-500'
                  ]">
                    <span class="mdi mdi-account"></span>
                  </div>
                  <span class="text-center">{{ member }}</span>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Developers - more columns on wider screens -->
          <div class="mt-6">
            <label class="block text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
              <span class="mdi mdi-laptop text-primary-600"></span>
              Developers
            </label>
            <div class="bg-neutral-50 p-4 rounded-lg border border-neutral-100">
              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                <div 
                  v-for="member in teamMembers"
                  :key="`dev-${member}`"
                  class="flex items-center gap-3 bg-white p-3 rounded-md transition-all duration-200 hover:bg-neutral-50 cursor-pointer"
                  @click="() => {
                    const index = formData.developers.indexOf(member);
                    if (index === -1) formData.developers.push(member);
                    else formData.developers.splice(index, 1);
                  }"
                >
                  <div :class="[
                    'h-5 w-5 rounded-md flex items-center justify-center border',
                    formData.developers.includes(member) ? 'bg-primary-500 border-primary-600' : 'bg-white border-neutral-300'
                  ]">
                    <span v-if="formData.developers.includes(member)" class="mdi mdi-check text-white text-sm"></span>
                  </div>
                  <label class="text-sm cursor-pointer flex-1">{{ member }}</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Blockers and Feedback Card with tabs - wider tabs with more space -->
        <div class="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
          <div class="border-b border-neutral-200 pb-2">
            <div class="flex -mb-px">
              <button 
                type="button" 
                @click="switchTab('blockers')" 
                :class="[
                  'py-3 px-6 text-sm font-medium border-b-2 focus:outline-none',
                  activeTab === 'blockers' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                ]"
              >
                <span class="mdi mdi-alert-octagon-outline mr-2"></span>
                Blockers
              </button>
              <button 
                type="button" 
                @click="switchTab('feedback')" 
                :class="[
                  'py-3 px-6 text-sm font-medium border-b-2 focus:outline-none',
                  activeTab === 'feedback' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                ]"
              >
                <span class="mdi mdi-message-reply-text-outline mr-2"></span>
                Feedback
              </button>
              <button 
                type="button" 
                @click="switchTab('comments')" 
                :class="[
                  'py-3 px-6 text-sm font-medium border-b-2 focus:outline-none',
                  activeTab === 'comments' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                ]"
              >
                <span class="mdi mdi-comment-text-outline mr-2"></span>
                Comments
              </button>
            </div>
          </div>
          
          <!-- Content sections with taller textareas for wider form -->
          <div v-show="activeTab === 'blockers'" class="py-5">
            <div class="bg-neutral-50 rounded-lg p-5">
              <label for="project-blockers" class="block text-sm font-medium text-neutral-700 mb-3">Issues preventing progress</label>
              <div class="relative">
                <textarea
                  id="project-blockers"
                  v-model="formData.blockers"
                  rows="4"
                  placeholder="List any blockers preventing progress..."
                  class="block w-full rounded-md border border-neutral-300 px-5 py-4 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors resize-none"
                ></textarea>
                <span class="mdi mdi-alert-circle absolute top-4 right-4 text-red-400 text-lg"></span>
              </div>
            </div>
          </div>
          
          <div v-show="activeTab === 'feedback'" class="py-5">
            <div class="bg-neutral-50 rounded-lg p-5">
              <label for="project-feedback" class="block text-sm font-medium text-neutral-700 mb-3">Feedback for blockers</label>
              <div class="relative">
                <textarea
                  id="project-feedback"
                  v-model="formData.feedbackForBlockers"
                  rows="4"
                  placeholder="Add feedback about project blockers..."
                  class="block w-full rounded-md border border-neutral-300 px-5 py-4 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors resize-none"
                ></textarea>
                <span class="mdi mdi-message-reply absolute top-4 right-4 text-primary-400 text-lg"></span>
              </div>
            </div>
          </div>
          
          <div v-show="activeTab === 'comments'" class="py-5">
            <div class="bg-neutral-50 rounded-lg p-5">
              <label for="project-comments" class="block text-sm font-medium text-neutral-700 mb-3">Project comments</label>
              <div class="relative">
                <textarea
                  id="project-comments"
                  v-model="formData.comments"
                  rows="4"
                  placeholder="Add general project comments..."
                  class="block w-full rounded-md border border-neutral-300 px-5 py-4 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors resize-none"
                ></textarea>
                <span class="mdi mdi-comment absolute top-4 right-4 text-neutral-400 text-lg"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Form Actions - wider buttons for the expanded form -->
    <div class="sticky bottom-0 bg-white p-5 rounded-lg shadow-lg border border-neutral-100 flex justify-between items-center z-10">
      <div class="text-sm">
        <span v-if="showFormValidationTip && !isFormValid" class="flex items-center text-warning-600 animate-pulse">
          <span class="mdi mdi-alert-circle mr-2 text-lg"></span>
          Please fill in all required fields
        </span>
      </div>
      <div class="flex space-x-4">
        <button
          type="button"
          @click="handleCancel"
          class="px-6 py-2.5 border border-neutral-300 rounded-md shadow-sm text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex items-center px-8 py-2.5 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors"
        >
          <span class="mr-1">{{ isEditing ? 'Update' : 'Create' }}</span>
          {{ isEditing ? 'Project' : 'Project' }}
          <span v-if="isSubmitting" class="ml-2">
            <span class="animate-spin inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
          </span>
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped>
/* Smooth transitions */
.max-h-0 {
  max-height: 0;
  overflow: hidden;
}

.max-h-500px, .max-h-800px, .max-h-1000px, .max-h-2000px {
  overflow: hidden;
}

/* Define the actual max-heights */
.max-h-500px {
  max-height: 500px;
}

.max-h-800px {
  max-height: 800px;
}

.max-h-1000px {
  max-height: 1000px;
}

.max-h-2000px {
  max-height: 2000px;
}

/* Custom scrollbars for textareas */
textarea::-webkit-scrollbar {
  width: 10px;
}

textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

textarea::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 6px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* Animation for validation messages */
@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

/* Range input customization */
input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

input[type=range]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}
</style>