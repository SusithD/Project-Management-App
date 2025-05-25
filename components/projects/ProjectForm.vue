<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useUsersStore } from '~/stores/users';
import UserSelect from '~/components/common/UserSelect.vue';

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

// Initialize users store
const usersStore = useUsersStore();

// Form data
const formData = ref({...props.initialData});

// Wizard state
const currentStep = ref(1);
const totalSteps = 5;
const stepValidation = ref({});
const showFormValidationTip = ref(false);
const formSubmitAttempted = ref(false);

// Animation states
const isProgressHovered = ref(false);

// Visual enhancements
const activeTab = ref('remarks'); // For tabs in certain sections

// Wizard steps configuration
const wizardSteps = [
  {
    id: 1,
    title: 'Basic Information',
    subtitle: 'Project name, category, status, and priority',
    icon: 'mdi-information-outline',
    fields: ['name', 'category', 'status', 'priority', 'progress']
  },
  {
    id: 2,
    title: 'Timeline',
    subtitle: 'Project start and end dates, duration',
    icon: 'mdi-calendar-range',
    fields: ['startDate', 'endDate']
  },
  {
    id: 3,
    title: 'Team Information',
    subtitle: 'Project lead and team members',
    icon: 'mdi-account-group',
    fields: ['assignedTo', 'team']
  },
  {
    id: 4,
    title: 'Project Details',
    subtitle: 'Company, phase, deadlines, and responsibilities',
    icon: 'mdi-file-document-outline',
    fields: ['company', 'statusPhase', 'deadline', 'initiallyRaisedOn', 'responsiblePerson', 'developers']
  },
  {
    id: 5,
    title: 'Additional Information',
    subtitle: 'Remarks, notes, blockers, and feedback',
    icon: 'mdi-text-box-outline',
    fields: ['remarks', 'notes', 'blockers', 'comments', 'feedbackForBlockers']
  }
];

// Project status options
const statusOptions = ['Ongoing', 'Completed', 'On Hold'];

// Priority options
const priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

// Category options
const categoryOptions = ['Development', 'Design', 'Marketing', 'Research', 'Support', 'Other'];

// Status Phase options
const statusPhaseOptions = ['Planning', 'Development', 'Testing', 'Deployment', 'Maintenance'];

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

// Computed validation states
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

// Validate current step
const validateCurrentStep = () => {
  const currentStepConfig = wizardSteps[currentStep.value - 1];
  const requiredFields = currentStepConfig.fields.filter(field => 
    ['name', 'assignedTo', 'startDate', 'endDate', 'category', 'priority'].includes(field)
  );
  
  for (const field of requiredFields) {
    if (!fieldValidation.value[field]) {
      return false;
    }
  }
  return true;
};

// Check if step is completed
const isStepCompleted = (stepId) => {
  const stepConfig = wizardSteps[stepId - 1];
  const requiredFields = stepConfig.fields.filter(field => 
    ['name', 'assignedTo', 'startDate', 'endDate', 'category', 'priority'].includes(field)
  );
  
  return requiredFields.every(field => fieldValidation.value[field]);
};

// Calculate estimated days
const estimatedDays = computed(() => {
  if (!formData.value.startDate || !formData.value.endDate) return 0;
  
  const start = new Date(formData.value.startDate);
  const end = new Date(formData.value.endDate);
  
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
});

// Calculate pending days
const calculatePendingDays = () => {
  if (formData.value.initiallyRaisedOn) {
    const initialDate = new Date(formData.value.initiallyRaisedOn);
    const currentDate = new Date();
    formData.value.pendingDays = Math.ceil((currentDate - initialDate) / (1000 * 60 * 60 * 24));
  }
};

// Navigation functions
const nextStep = () => {
  if (validateCurrentStep()) {
    if (currentStep.value < totalSteps) {
      currentStep.value++;
    }
  } else {
    formSubmitAttempted.value = true;
    showFormValidationTip.value = true;
    setTimeout(() => {
      showFormValidationTip.value = false;
    }, 3000);
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const goToStep = (stepId) => {
  // Allow going to previous steps or next step if current is valid
  if (stepId <= currentStep.value || validateCurrentStep()) {
    currentStep.value = stepId;
  }
};

// Switch tabs within sections
const switchTab = (tab) => {
  activeTab.value = tab;
};

// Show form validation tip
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
onMounted(async () => {
  // Ensure users are loaded
  if (usersStore.users.length === 0 || usersStore.error) {
    try {
      await usersStore.fetchUsers();
    } catch (error) {
      console.error('Failed to load users in ProjectForm:', error);
    }
  }
  
  calculatePendingDays();
});

// Handle form submission
const handleSubmit = () => {
  formSubmitAttempted.value = true;
  
  // Validate all required fields
  const isValid = Object.values(fieldValidation.value).every(valid => valid);
  
  if (isValid) {
    calculatePendingDays();
    emit('submit', {...formData.value});
  } else {
    showValidationTip();
    // Go to first invalid step
    for (let i = 0; i < wizardSteps.length; i++) {
      const stepConfig = wizardSteps[i];
      const requiredFields = stepConfig.fields.filter(field => 
        ['name', 'assignedTo', 'startDate', 'endDate', 'category', 'priority'].includes(field)
      );
      
      if (!requiredFields.every(field => fieldValidation.value[field])) {
        currentStep.value = i + 1;
        break;
      }
    }
  }
};

// Handle cancel
const handleCancel = () => {
  emit('cancel');
};

// Add debugging function to check available user roles
const availableRoles = computed(() => {
  const roles = new Set();
  usersStore.users.forEach(user => {
    if (user.role) roles.add(user.role);
  });
  return Array.from(roles);
});
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Wizard Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-neutral-900 mb-2">
        {{ isEditing ? 'Edit Project' : 'Create New Project' }}
      </h2>
      <p class="text-neutral-600">Follow the steps below to {{ isEditing ? 'update' : 'create' }} your project</p>
    </div>

    <!-- Progress Bar -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <span class="text-sm font-medium text-neutral-700">Step {{ currentStep }} of {{ totalSteps }}</span>
        <span class="text-sm text-neutral-500">{{ Math.round((currentStep / totalSteps) * 100) }}% Complete</span>
      </div>
      <div class="w-full bg-neutral-200 rounded-full h-2">
        <div 
          class="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
          :style="`width: ${(currentStep / totalSteps) * 100}%`"
        ></div>
      </div>
    </div>

    <!-- Step Indicators -->
    <div class="flex justify-between mb-8">
      <div 
        v-for="step in wizardSteps" 
        :key="step.id"
        class="flex flex-col items-center cursor-pointer"
        @click="goToStep(step.id)"
      >
        <div 
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
            currentStep === step.id 
              ? 'bg-primary-600 text-white' 
              : currentStep > step.id || isStepCompleted(step.id)
                ? 'bg-success-600 text-white'
                : 'bg-neutral-200 text-neutral-500'
          ]"
        >
          <span v-if="currentStep > step.id || isStepCompleted(step.id)" class="mdi mdi-check"></span>
          <span v-else class="mdi" :class="step.icon"></span>
        </div>
        <span 
          :class="[
            'mt-2 text-xs text-center max-w-20',
            currentStep === step.id ? 'text-primary-600 font-medium' : 'text-neutral-500'
          ]"
        >
          {{ step.title }}
        </span>
      </div>
    </div>

    <!-- Wizard Content -->
    <form @submit.prevent="handleSubmit" class="bg-white rounded-lg shadow-lg border border-neutral-200">
      <!-- Current Step Header -->
      <div class="px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-white">
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span class="mdi text-xl text-primary-600" :class="wizardSteps[currentStep - 1].icon"></span>
          </div>
          <div>
            <h3 class="text-lg font-medium text-neutral-800">{{ wizardSteps[currentStep - 1].title }}</h3>
            <p class="text-sm text-neutral-600">{{ wizardSteps[currentStep - 1].subtitle }}</p>
          </div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="p-6 min-h-96">
        <!-- Step 1: Basic Information -->
        <div v-if="currentStep === 1" class="space-y-6">
          <!-- Project Name -->
          <div class="transition-all duration-200 hover:bg-neutral-50 p-4 rounded-md">
            <label for="project-name" class="block text-sm font-medium text-neutral-700 mb-2">Project Name *</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-500">
                <span class="mdi mdi-folder-outline"></span>
              </span>
              <input
                id="project-name"
                v-model="formData.name"
                type="text"
                placeholder="Enter project name"
                :class="[
                  'pl-10 block w-full rounded-md border px-3 py-2.5 shadow-sm transition-all duration-200 focus:ring-2',
                  !fieldValidation.name && formSubmitAttempted ? 
                  'border-red-300 focus:border-red-500 focus:ring-red-200' : 
                  'border-neutral-300 focus:border-primary-500 focus:ring-primary-200'
                ]"
                required
              />
              <span v-if="!fieldValidation.name && formSubmitAttempted" class="text-xs text-red-500 mt-1 block">
                Project name is required
              </span>
            </div>
          </div>

          <!-- Category & Status -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Category -->
            <div class="transition-all duration-200 hover:bg-neutral-50 p-4 rounded-md">
              <label for="project-category" class="block text-sm font-medium text-neutral-700 mb-2">Category *</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-500">
                  <span class="mdi mdi-shape-outline"></span>
                </span>
                <select
                  id="project-category"
                  v-model="formData.category"
                  :class="[
                    'pl-10 block w-full rounded-md border px-3 py-2.5 shadow-sm appearance-none transition-all duration-200 focus:ring-2',
                    !fieldValidation.category && formSubmitAttempted ? 
                    'border-red-300 focus:border-red-500 focus:ring-red-200' : 
                    'border-neutral-300 focus:border-primary-500 focus:ring-primary-200'
                  ]"
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
                <span v-if="!fieldValidation.category && formSubmitAttempted" class="text-xs text-red-500 mt-1 block">
                  Category is required
                </span>
              </div>
            </div>

            <!-- Status -->
            <div class="transition-all duration-200 hover:bg-neutral-50 p-4 rounded-md">
              <label class="block text-sm font-medium text-neutral-700 mb-2">Status</label>
              <div class="flex gap-2">
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
                      'block text-center py-2 px-3 text-sm border rounded-md cursor-pointer transition-all duration-200',
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

          <!-- Priority -->
          <div class="transition-all duration-200 hover:bg-neutral-50 p-4 rounded-md">
            <label class="block text-sm font-medium text-neutral-700 mb-2">Priority</label>
            <div class="flex flex-wrap gap-2">
              <template v-for="priority in priorityOptions" :key="priority">
                <input 
                  type="radio" 
                  :id="`priority-${priority}`" 
                  :value="priority" 
                  v-model="formData.priority"
                  class="sr-only peer"
                />
                <label 
                  :for="`priority-${priority}`" 
                  :class="[
                    'inline-flex items-center gap-1 px-3 py-2 rounded-full cursor-pointer text-sm transition-all duration-200',
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
          </div>

          <!-- Progress -->
          <div class="bg-neutral-50 rounded-md p-5">
            <div class="flex justify-between items-center mb-3">
              <label class="block text-sm font-medium text-neutral-700 flex items-center gap-2">
                <span class="mdi mdi-chart-line text-lg text-primary-600"></span>
                Progress
              </label>
              <span 
                :class="[
                  'text-xs font-medium py-1 px-3 rounded-full transition-all duration-300', 
                  formData.progress >= 75 ? 'bg-success-100 text-success-800' : 
                  formData.progress >= 40 ? 'bg-accent-100 text-accent-800' : 
                  'bg-warning-100 text-warning-800'
                ]"
              >
                {{ formData.progress }}%
              </span>
            </div>
            <div class="relative">
              <div class="w-full bg-neutral-200 rounded-full h-4 mb-2 overflow-hidden">
                <div 
                  :class="['h-4 rounded-full transition-all duration-300', progressColor]"
                  :style="`width: ${formData.progress}%`"
                ></div>
              </div> 
              <input
                v-model="formData.progress"
                type="range"
                min="0"
                max="100"
                step="5"
                class="absolute top-0 left-0 w-full opacity-0 cursor-pointer h-4"
              />
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

        <!-- Step 2: Timeline -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Start Date -->
            <div class="transition-all duration-200 hover:bg-neutral-50 rounded-md p-4">
              <label for="project-start-date" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-1">
                <span class="mdi mdi-calendar-start text-primary-600"></span>
                Start Date *
              </label>
              <input
                id="project-start-date"
                v-model="formData.startDate"
                type="date"
                :class="[
                  'block w-full rounded-md border px-3 py-2.5 shadow-sm transition-all duration-200 focus:ring-2',
                  !fieldValidation.startDate && formSubmitAttempted ? 
                  'border-red-300 focus:border-red-500 focus:ring-red-200' : 
                  'border-neutral-300 focus:border-primary-500 focus:ring-primary-200'
                ]"
                required
              />
              <span v-if="!fieldValidation.startDate && formSubmitAttempted" class="text-xs text-red-500 mt-1 block">
                Start date is required
              </span>
            </div>

            <!-- End Date -->
            <div class="transition-all duration-200 hover:bg-neutral-50 rounded-md p-4">
              <label for="project-end-date" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-1">
                <span class="mdi mdi-calendar-end text-primary-600"></span>
                End Date *
              </label>
              <input
                id="project-end-date"
                v-model="formData.endDate"
                type="date"
                :class="[
                  'block w-full rounded-md border px-3 py-2.5 shadow-sm transition-all duration-200 focus:ring-2',
                  !fieldValidation.endDate && formSubmitAttempted ? 
                  'border-red-300 focus:border-red-500 focus:ring-red-200' : 
                  'border-neutral-300 focus:border-primary-500 focus:ring-primary-200'
                ]"
                required
              />
              <span v-if="!fieldValidation.endDate && formSubmitAttempted" class="text-xs text-red-500 mt-1 block">
                End date is required
              </span>
            </div>
          </div>

          <!-- Duration Display -->
          <div class="bg-neutral-50 rounded-lg p-5 text-center">
            <div class="inline-flex items-center gap-3 px-6 py-4 bg-white border border-neutral-200 rounded-lg">
              <span class="mdi mdi-calendar-clock text-primary-600 text-xl"></span>
              <div>
                <span class="text-lg font-medium text-neutral-900">{{ estimatedDays }} days</span>
                <p class="text-sm text-neutral-500">Estimated Duration</p>
              </div>
            </div>
          </div>

          <!-- Timeline visualization -->
          <div v-if="formData.startDate && formData.endDate" class="relative pt-8 pb-4">
            <div class="absolute left-0 right-0 top-0 flex justify-between px-6">
              <div class="text-sm text-neutral-500">Start</div>
              <div class="text-sm text-neutral-500">End</div>
            </div>
            <div class="h-5 bg-neutral-100 rounded-full overflow-hidden relative">
              <div class="absolute h-full bg-primary-500 rounded-full" style="left: 0%; width: 100%;"></div>
            </div>
            <div class="flex justify-between mt-3">
              <div class="text-sm font-medium">{{ formData.startDate }}</div>
              <div class="text-sm font-medium">{{ formData.endDate }}</div>
            </div>
          </div>
        </div>

        <!-- Step 3: Team Information -->
        <div v-if="currentStep === 3" class="space-y-6">
          <!-- Project Lead -->
          <div class="transition-all duration-200 hover:bg-neutral-50 p-4 rounded-md">
            <label class="block text-sm font-medium text-neutral-700 mb-3">Project Lead *</label>
            <UserSelect
              v-model="formData.assignedTo"
              :required="true"
              placeholder="Select project lead"
              :filterRole="''"
              :showAvailability="true"
            />
            <span v-if="!fieldValidation.assignedTo && formSubmitAttempted" class="text-xs text-red-500 mt-2 block">
              Project lead is required
            </span>
          </div>

          <!-- Team Members -->
          <div class="bg-neutral-50 p-5 rounded-lg">
            <label class="block text-sm font-medium text-neutral-700 mb-4 flex items-center gap-2">
              <span class="mdi mdi-account-multiple text-primary-600"></span>
              Team Members
            </label>
            <UserSelect
              v-model="formData.team"
              multiple
              placeholder="Select team members"
              :showAvailability="true"
            />
          </div>

          <!-- Team Summary -->
          <div v-if="formData.team && formData.team.length > 0" class="bg-white border border-neutral-200 rounded-lg p-4">
            <h4 class="text-sm font-medium text-neutral-700 mb-3">Team Summary</h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="memberId in formData.team" :key="`badge-${memberId}`" 
                class="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
              >
                <span class="mdi mdi-account-circle"></span>
                {{ usersStore.getUserDisplayName(memberId) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Project Details -->
        <div v-if="currentStep === 4" class="space-y-6">
          <!-- Company & Status Phase -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Company -->
            <div class="bg-neutral-50 rounded-lg p-4">
              <label for="project-company" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <span class="mdi mdi-office-building text-primary-600"></span>
                Company
              </label>
              <input
                id="project-company"
                v-model="formData.company"
                type="text"
                placeholder="Enter company name"
                class="block w-full rounded-md border border-neutral-300 px-4 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <!-- Status Phase -->
            <div class="bg-neutral-50 rounded-lg p-4">
              <label for="project-status-phase" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <span class="mdi mdi-playlist-check text-primary-600"></span>
                Status Phase
              </label>
              <select
                id="project-status-phase"
                v-model="formData.statusPhase"
                class="block w-full rounded-md border border-neutral-300 px-4 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 appearance-none"
              >
                <option value="" disabled>Select status phase</option>
                <option v-for="phase in statusPhaseOptions" :key="phase" :value="phase">
                  {{ phase }}
                </option>
              </select>
            </div>
          </div>

          <!-- Timeline Details -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Deadline -->
            <div class="bg-neutral-50 rounded-lg p-4">
              <label for="project-deadline" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <span class="mdi mdi-clock-alert-outline text-primary-600"></span>
                Deadline
              </label>
              <input
                id="project-deadline"
                v-model="formData.deadline"
                type="date"
                class="block w-full rounded-md border border-neutral-300 px-3 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <!-- Initially Raised On -->
            <div class="bg-neutral-50 rounded-lg p-4">
              <label for="project-raised-on" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <span class="mdi mdi-calendar-plus text-primary-600"></span>
                Initially Raised On
              </label>
              <input
                id="project-raised-on"
                v-model="formData.initiallyRaisedOn"
                type="date"
                class="block w-full rounded-md border border-neutral-300 px-3 py-2.5 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
          </div>

          <!-- People Assignment -->
          <div class="space-y-4">
            <h4 class="text-sm font-medium text-neutral-700">People Assignment</h4>
            
            <!-- Responsible Person -->
            <div class="bg-white border border-neutral-200 rounded-lg p-4">
              <label class="block text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                <span class="mdi mdi-account-check text-primary-600"></span>
                Responsible Person
              </label>
              <UserSelect
                v-model="formData.responsiblePerson"
                placeholder="Select responsible person"
                :filterRole="null"
              />
            </div>

            <!-- Developers -->
            <div class="bg-white border border-neutral-200 rounded-lg p-4">
              <label class="block text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                <span class="mdi mdi-laptop text-primary-600"></span>
                Developers
              </label>
              <UserSelect
                v-model="formData.developers"
                multiple
                placeholder="Select developers"
                :filterRole="'Developer'"
                :showAvailability="true"
              />
            </div>
          </div>
        </div>

        <!-- Step 5: Additional Information -->
        <div v-if="currentStep === 5" class="space-y-6">
          <!-- Tabs for different types of information -->
          <div class="border-b border-neutral-200">
            <div class="flex -mb-px">
              <button 
                type="button" 
                @click="switchTab('remarks')" 
                :class="[
                  'py-2 px-4 text-sm font-medium border-b-2 focus:outline-none transition-colors',
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
                  'py-2 px-4 text-sm font-medium border-b-2 focus:outline-none transition-colors',
                  activeTab === 'notes' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                ]"
              >
                <span class="mdi mdi-note-text-outline mr-1"></span>
                Notes
              </button>
              <button 
                type="button" 
                @click="switchTab('blockers')" 
                :class="[
                  'py-2 px-4 text-sm font-medium border-b-2 focus:outline-none transition-colors',
                  activeTab === 'blockers' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                ]"
              >
                <span class="mdi mdi-alert-octagon-outline mr-1"></span>
                Blockers
              </button>
              <button 
                type="button" 
                @click="switchTab('feedback')" 
                :class="[
                  'py-2 px-4 text-sm font-medium border-b-2 focus:outline-none transition-colors',
                  activeTab === 'feedback' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'
                ]"
              >
                <span class="mdi mdi-message-reply-text-outline mr-1"></span>
                Feedback
              </button>
            </div>
          </div>

          <!-- Tab Content -->
          <div class="py-4">
            <!-- Remarks -->
            <div v-show="activeTab === 'remarks'" class="bg-neutral-50 rounded-lg p-5">
              <label for="project-remarks" class="block text-sm font-medium text-neutral-700 mb-3">Project Remarks</label>
              <textarea
                id="project-remarks"
                v-model="formData.remarks"
                rows="4"
                placeholder="Add project remarks..."
                class="block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 resize-none"
              ></textarea>
            </div>

            <!-- Notes -->
            <div v-show="activeTab === 'notes'" class="bg-neutral-50 rounded-lg p-5">
              <label for="project-notes" class="block text-sm font-medium text-neutral-700 mb-3">Additional Notes</label>
              <textarea
                id="project-notes"
                v-model="formData.notes"
                rows="4"
                placeholder="Add additional notes about this project..."
                class="block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 resize-none"
              ></textarea>
            </div>

            <!-- Blockers -->
            <div v-show="activeTab === 'blockers'" class="bg-neutral-50 rounded-lg p-5">
              <label for="project-blockers" class="block text-sm font-medium text-neutral-700 mb-3">Project Blockers</label>
              <textarea
                id="project-blockers"
                v-model="formData.blockers"
                rows="4"
                placeholder="List any blockers preventing progress..."
                class="block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 resize-none"
              ></textarea>
            </div>

            <!-- Feedback -->
            <div v-show="activeTab === 'feedback'" class="bg-neutral-50 rounded-lg p-5">
              <label for="project-feedback" class="block text-sm font-medium text-neutral-700 mb-3">Feedback for Blockers</label>
              <textarea
                id="project-feedback"
                v-model="formData.feedbackForBlockers"
                rows="4"
                placeholder="Add feedback about project blockers..."
                class="block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Additional Comments -->
          <div class="bg-white border border-neutral-200 rounded-lg p-4">
            <label for="project-comments" class="block text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
              <span class="mdi mdi-comment-text-outline text-primary-600"></span>
              General Comments
            </label>
            <textarea
              id="project-comments"
              v-model="formData.comments"
              rows="3"
              placeholder="Add general project comments..."
              class="block w-full rounded-md border border-neutral-300 px-4 py-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Navigation Footer -->
      <div class="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex justify-between items-center">
        <!-- Validation Message -->
        <div class="flex-1">
          <span v-if="showFormValidationTip" class="flex items-center text-red-600 text-sm">
            <span class="mdi mdi-alert-circle mr-2"></span>
            Please fill in all required fields
          </span>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center gap-3">
          <!-- Cancel Button -->
          <button
            type="button"
            @click="handleCancel"
            class="px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Cancel
          </button>

          <!-- Previous Button -->
          <button
            v-if="currentStep > 1"
            type="button"
            @click="prevStep"
            class="px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <span class="mdi mdi-chevron-left mr-1"></span>
            Previous
          </button>

          <!-- Next/Submit Button -->
          <button
            v-if="currentStep < totalSteps"
            type="button"
            @click="nextStep"
            class="px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Next
            <span class="mdi mdi-chevron-right ml-1"></span>
          </button>

          <button
            v-else
            type="submit"
            :disabled="isSubmitting"
            class="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors"
          >
            <span class="mr-1">{{ isEditing ? 'Update' : 'Create' }}</span>
            Project
            <span v-if="isSubmitting" class="ml-2">
              <span class="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            </span>
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Custom scrollbars for textareas */
textarea::-webkit-scrollbar {
  width: 8px;
}

textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #aaa;
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
  border: none;
}

/* Smooth transitions */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>