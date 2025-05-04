<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProjectsStore } from '~/stores/projects';
import { useNotificationsStore } from '~/stores/notifications';
import ProjectForm from '~/components/projects/ProjectForm.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);
const projectsStore = useProjectsStore();
const notificationsStore = useNotificationsStore();
const router = useRouter();

// Track submission state
const isSubmitting = ref(false);

// Handle project creation
const handleSubmit = async (formData) => {
  try {
    isSubmitting.value = true;
    const newProject = await projectsStore.createProject(formData);
    emit('close');
    
    // Show success notification
    notificationsStore.success(`Project "${newProject.name}" created successfully`);
    
    // Navigate to the newly created project
    router.push(`/projects/${newProject.id}`);
  } catch (error) {
    console.error('Failed to create project:', error);
    notificationsStore.error('Failed to create project. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

// Handle cancel
const handleCancel = () => {
  emit('close');
};
</script>

<template>
  <transition 
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="handleCancel"></div>
        
        <!-- Modal Content - Increased width from max-w-lg to max-w-7xl -->
        <div 
          class="transform overflow-hidden rounded-lg bg-white px-6 pb-6 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-7xl mx-auto"
        >
          <div class="flex justify-between items-center border-b border-neutral-200 pb-4 mb-4">
            <h3 class="text-lg font-semibold text-neutral-800">Add New Project</h3>
            <button 
              @click="handleCancel" 
              class="text-neutral-500 hover:text-neutral-700 focus:outline-none"
            >
              <span class="mdi mdi-close text-xl"></span>
            </button>
          </div>
          
          <!-- The ProjectForm component with some additional padding -->
          <div class="px-2">
            <ProjectForm
              :is-submitting="isSubmitting"
              @submit="handleSubmit"
              @cancel="handleCancel"
            />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>