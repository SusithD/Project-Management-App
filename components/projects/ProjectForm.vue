<script setup>
import { ref, computed, watch } from 'vue';

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
      team: []
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
  additional: false
});

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

// Toggle section visibility
const toggleSection = (section) => {
  activeSections.value[section] = !activeSections.value[section];
};

// Get progress color based on value
const progressColor = computed(() => {
  const progress = formData.value.progress;
  if (progress >= 75) return 'bg-success-600';
  if (progress >= 40) return 'bg-accent-600';
  return 'bg-warning-600';
});

// Computed validation states
const isFormValid = computed(() => {
  return formData.value.name && 
         formData.value.assignedTo && 
         formData.value.startDate &&
         formData.value.endDate &&
         formData.value.category &&
         formData.value.priority;
});

// Calculate estimated days
const estimatedDays = computed(() => {
  if (!formData.value.startDate || !formData.value.endDate) return 0;
  
  const start = new Date(formData.value.startDate);
  const end = new Date(formData.value.endDate);
  
  // Return difference in days
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
});

// Handle form submission
const handleSubmit = () => {
  if (isFormValid.value) {
    emit('submit', {...formData.value});
  }
};

// Handle cancel
const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-8">
    <!-- Basic Information Section -->
    <div class="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
      <div 
        class="flex items-center justify-between cursor-pointer" 
        @click="toggleSection('basicInfo')"
      >
        <div class="flex items-center gap-2">
          <span class="mdi mdi-information-outline text-xl text-primary-600"></span>
          <h3 class="text-lg font-medium text-neutral-800">Basic Information</h3>
        </div>
        <span 
          :class="['mdi text-xl transition-transform', 
                  activeSections.basicInfo ? 'mdi-chevron-up' : 'mdi-chevron-down']"
        ></span>
      </div>
      
      <div v-show="activeSections.basicInfo" class="mt-4 space-y-5 transition-all">
        <!-- Project Name -->
        <div>
          <label for="project-name" class="block text-sm font-medium text-neutral-700">Project Name</label>
          <div class="relative mt-1">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <span class="mdi mdi-folder-outline"></span>
            </span>
            <input
              id="project-name"
              v-model="formData.name"
              type="text"
              placeholder="Enter project name"
              class="pl-10 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors"
              required
            />
          </div>
        </div>
        
        <!-- Category & Status: Two columns -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Category -->
          <div>
            <label for="project-category" class="block text-sm font-medium text-neutral-700">Category</label>
            <div class="relative mt-1">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <span class="mdi mdi-shape-outline"></span>
              </span>
              <select
                id="project-category"
                v-model="formData.category"
                class="pl-10 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors"
                required
              >
                <option value="" disabled>Select category</option>
                <option v-for="category in categoryOptions" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>
          </div>
          
          <!-- Status -->
          <div>
            <label for="project-status" class="block text-sm font-medium text-neutral-700">Status</label>
            <div class="relative mt-1">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <span class="mdi mdi-flag-outline"></span>
              </span>
              <select
                id="project-status"
                v-model="formData.status"
                class="pl-10 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors"
              >
                <option v-for="status in statusOptions" :key="status" :value="status">
                  {{ status }}
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <!-- Progress -->
        <div>
          <div class="flex justify-between items-center">
            <label for="project-progress" class="block text-sm font-medium text-neutral-700">
              Progress
            </label>
            <span 
              :class="[
                'text-xs font-medium py-1 px-2 rounded-full', 
                formData.progress >= 75 ? 'bg-success-100 text-success-800' : 
                formData.progress >= 40 ? 'bg-accent-100 text-accent-800' : 
                'bg-warning-100 text-warning-800'
              ]"
            >
              {{ formData.progress }}%
            </span>
          </div>
          <div class="mt-2 relative">
            <div class="w-full bg-neutral-200 rounded-full h-2 mb-2">
              <div 
                :class="['h-2 rounded-full transition-all', progressColor]"
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
              class="absolute top-0 left-0 w-full opacity-0 cursor-pointer h-2"
            />
          </div>
        </div>
        
        <!-- Priority: Single column -->
        <div>
          <!-- Priority -->
          <div>
            <label for="project-priority" class="block text-sm font-medium text-neutral-700">Priority</label>
            <div class="relative mt-1">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <span class="mdi mdi-priority-high"></span>
              </span>
              <select
                id="project-priority"
                v-model="formData.priority"
                class="pl-10 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors"
                required
              >
                <option v-for="priority in priorityOptions" :key="priority" :value="priority">
                  {{ priority }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Timeline Section -->
    <div class="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
      <div 
        class="flex items-center justify-between cursor-pointer" 
        @click="toggleSection('timeline')"
      >
        <div class="flex items-center gap-2">
          <span class="mdi mdi-calendar-range text-xl text-primary-600"></span>
          <h3 class="text-lg font-medium text-neutral-800">Timeline</h3>
        </div>
        <span 
          :class="['mdi text-xl transition-transform', 
                  activeSections.timeline ? 'mdi-chevron-up' : 'mdi-chevron-down']"
        ></span>
      </div>
      
      <div v-show="activeSections.timeline" class="mt-4 space-y-5 transition-all">
        <!-- Start & End Date: Two columns -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <!-- Start Date -->
          <div>
            <label for="project-start-date" class="block text-sm font-medium text-neutral-700">Start Date</label>
            <div class="relative mt-1">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <span class="mdi mdi-calendar-start"></span>
              </span>
              <input
                id="project-start-date"
                v-model="formData.startDate"
                type="date"
                class="pl-10 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors"
                required
              />
            </div>
          </div>
          
          <!-- End Date -->
          <div>
            <label for="project-end-date" class="block text-sm font-medium text-neutral-700">End Date</label>
            <div class="relative mt-1">
              <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                <span class="mdi mdi-calendar-end"></span>
              </span>
              <input
                id="project-end-date"
                v-model="formData.endDate"
                type="date"
                class="pl-10 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors"
                required
              />
            </div>
          </div>
        </div>
        
        <!-- Estimated Duration -->
        <div class="bg-neutral-50 p-3 rounded-md border border-neutral-200">
          <div class="flex items-center justify-between">
            <span class="text-sm text-neutral-700">Estimated Duration:</span>
            <span class="font-medium text-primary-700">{{ estimatedDays }} days</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Team Information Section -->
    <div class="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
      <div 
        class="flex items-center justify-between cursor-pointer" 
        @click="toggleSection('teamInfo')"
      >
        <div class="flex items-center gap-2">
          <span class="mdi mdi-account-group text-xl text-primary-600"></span>
          <h3 class="text-lg font-medium text-neutral-800">Team Information</h3>
        </div>
        <span 
          :class="['mdi text-xl transition-transform', 
                  activeSections.teamInfo ? 'mdi-chevron-up' : 'mdi-chevron-down']"
        ></span>
      </div>
      
      <div v-show="activeSections.teamInfo" class="mt-4 space-y-5 transition-all">
        <!-- Assigned To -->
        <div>
          <label for="project-assignee" class="block text-sm font-medium text-neutral-700">Project Lead</label>
          <div class="relative mt-1">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <span class="mdi mdi-account-tie"></span>
            </span>
            <select
              id="project-assignee"
              v-model="formData.assignedTo"
              class="pl-10 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors"
              required
            >
              <option value="" disabled>Select team member</option>
              <option v-for="member in teamMembers" :key="member" :value="member">
                {{ member }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- Team Members -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 mb-2">Team Members</label>
          <div class="space-y-2">
            <div 
              v-for="member in teamMembers"
              :key="member"
              class="flex items-center space-x-2"
            >
              <input
                :id="`team-member-${member.replace(' ', '-')}`"
                type="checkbox"
                :value="member"
                v-model="formData.team"
                class="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <label :for="`team-member-${member.replace(' ', '-')}`" class="text-sm text-neutral-700">
                {{ member }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Additional Info Section -->
    <div class="bg-white rounded-lg shadow-sm p-5 border border-neutral-100">
      <div 
        class="flex items-center justify-between cursor-pointer" 
        @click="toggleSection('additional')"
      >
        <div class="flex items-center gap-2">
          <span class="mdi mdi-text-box-outline text-xl text-primary-600"></span>
          <h3 class="text-lg font-medium text-neutral-800">Additional Information</h3>
        </div>
        <span 
          :class="['mdi text-xl transition-transform', 
                  activeSections.additional ? 'mdi-chevron-up' : 'mdi-chevron-down']"
        ></span>
      </div>
      
      <div v-show="activeSections.additional" class="mt-4 space-y-5 transition-all">
        <!-- Remarks -->
        <div>
          <label for="project-remarks" class="block text-sm font-medium text-neutral-700">Remarks</label>
          <div class="relative mt-1">
            <span class="absolute top-3 left-3 text-neutral-500">
              <span class="mdi mdi-clipboard-text-outline"></span>
            </span>
            <textarea
              id="project-remarks"
              v-model="formData.remarks"
              rows="3"
              placeholder="Add project remarks"
              class="pl-10 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors"
            ></textarea>
          </div>
        </div>
        
        <!-- Notes -->
        <div>
          <label for="project-notes" class="block text-sm font-medium text-neutral-700">Notes</label>
          <div class="relative mt-1">
            <span class="absolute top-3 left-3 text-neutral-500">
              <span class="mdi mdi-note-text-outline"></span>
            </span>
            <textarea
              id="project-notes"
              v-model="formData.notes"
              rows="3"
              placeholder="Add additional notes"
              class="pl-10 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 transition-colors"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Form Actions -->
    <div class="flex justify-between items-center pt-4">
      <div class="text-sm text-neutral-500">
        <span v-if="!isFormValid" class="flex items-center text-warning-600">
          <span class="mdi mdi-alert-circle mr-1"></span>
          Please fill in all required fields
        </span>
      </div>
      <div class="flex space-x-3">
        <button
          type="button"
          @click="handleCancel"
          class="px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors"
        >
          {{ isEditing ? 'Update Project' : 'Create Project' }}
          <span v-if="isSubmitting" class="ml-2">
            <span class="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          </span>
        </button>
      </div>
    </div>
  </form>
</template>