<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';
import { useNotificationsStore } from '~/stores/notifications';
import { useUsersStore } from '~/stores/users'; // Add this line to import users store

// Import the UserSelect component
import UserSelect from '~/components/common/UserSelect.vue';

// Define layout
definePageMeta({
  layout: 'dashboard'
});

const route = useRoute();
const router = useRouter();
const projectId = route.params.id;
const isLoading = ref(true);
const project = ref(null);
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const usersStore = useUsersStore(); // Initialize the users store
const error = ref(null);
// Store the MongoDB ObjectId once we have it
const mongoObjectId = ref(null);

// New update form state
const newUpdate = ref('');
const isSubmittingUpdate = ref(false);

// File upload state
const fileInput = ref(null);
const uploadingFile = ref(false);
const selectedFile = ref(null);
const uploadProgress = ref(0);

// Edit project state
const isEditing = ref(false);
const editedProject = ref(null);
const projectStatuses = ['Not Started', 'Ongoing', 'On Hold', 'Completed', 'Cancelled'];

// Add a computed property to determine if we're in edit mode with data
const hasExistingTeamMembers = computed(() => 
  editedProject.value && editedProject.value.team && editedProject.value.team.length > 0
);

const hasExistingDevelopers = computed(() => 
  editedProject.value && editedProject.value.developers && editedProject.value.developers.length > 0
);

// Get formatted team data for display
const formattedTeamData = computed(() => {
  if (!project.value) return { total: 0, members: 0, developers: 0, leadership: 0 };
  
  const leadCount = 
    (project.value.assignedTo ? 1 : 0) + 
    (project.value.responsiblePerson && project.value.responsiblePerson !== project.value.assignedTo ? 1 : 0);
  
  const members = project.value.team ? project.value.team.length : 0;
  const developers = project.value.developers ? project.value.developers.length : 0;
  
  return {
    total: leadCount + members + developers,
    members,
    developers,
    leadership: leadCount
  };
});

// Function to get user name from user ID
const getUserName = (userId) => {
  if (!userId) return 'Not assigned';
  
  const user = usersStore.users.find(user => user.id === userId);
  return user ? user.name : userId; // Return name if found, otherwise return ID as fallback
};

// Fetch project data from API
const fetchProject = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // First, we need to get the MongoDB ObjectId from our numeric ID
    // API call to fetch project data
    const response = await fetch(`/api/projects/${projectId}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching project: ${response.statusText}`);
    }
    
    const data = await response.json();
    project.value = data;
    
    // Save the MongoDB ObjectId for future API calls
    mongoObjectId.value = data._id;
    
    // Add default empty values for external links if they don't exist
    if (!project.value.externalLinks) {
      project.value.externalLinks = {
        githubRepo: '',
        figmaLink: '',
        jiraProject: ''
      };
    }
    
    // Initialize edit form with project data
    editedProject.value = { ...data };
    
    isLoading.value = false;
  } catch (err) {
    console.error('Error fetching project:', err);
    error.value = err.message;
    isLoading.value = false;
  }
};

// Add a project update
const addUpdate = async () => {
  if (!newUpdate.value.trim()) return;
  
  isSubmittingUpdate.value = true;
  
  try {
    // Create random ID for the update
    const updateId = Math.random().toString(36).substring(2, 15);
    
    const update = {
      id: updateId, // Add an ID field to satisfy the schema validation
      content: newUpdate.value,
      date: new Date().toISOString().split('T')[0],
      author: authStore.userFullName
    };
    
    // Use MongoDB ObjectId for API calls
    const idToUse = mongoObjectId.value || project.value?._id;
    
    if (!idToUse) {
      throw new Error("No valid MongoDB ID available");
    }
    
    // API call to add update
    const response = await fetch(`/api/projects/${idToUse}/updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authStore.authHeader
      },
      body: JSON.stringify(update)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to add update: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Add to local state first for immediate feedback
    if (!project.value.updates) {
      project.value.updates = [];
    }
    
    // Convert API response format to match UI format
    const uiUpdate = {
      id: data.update.id,
      content: data.update.message,
      date: data.update.date,
      author: data.update.user
    };
    
    project.value.updates.unshift(uiUpdate);
    
    // Clear input
    newUpdate.value = '';
    
    // Show success notification
    notificationsStore.success('Update added successfully');
  } catch (err) {
    console.error('Error adding update:', err);
    notificationsStore.error('Failed to add update. Please try again.');
  } finally {
    isSubmittingUpdate.value = false;
  }
};

// Handle file selection
const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    selectedFile.value = files[0];
  }
};

// Upload file
const uploadFile = async () => {
  if (!selectedFile.value) return;
  
  uploadingFile.value = true;
  uploadProgress.value = 0;
  
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    
    // Use MongoDB ObjectId for API calls
    const idToUse = mongoObjectId.value || project.value?._id;
    
    if (!idToUse) {
      throw new Error("No valid MongoDB ID available");
    }
    
    formData.append('projectId', idToUse);
    formData.append('uploadedBy', authStore.userFullName);
    
    // Use fetch with XMLHttpRequest to track progress
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        uploadProgress.value = Math.round((event.loaded / event.total) * 100);
      }
    });
    
    // Create a Promise to handle the XHR request
    await new Promise((resolve, reject) => {
      xhr.open('POST', `/api/projects/${idToUse}/files`);
      xhr.setRequestHeader('Authorization', authStore.authHeader);
      
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
    
    // Add file to project files list with response data (would come from API in real implementation)
    if (!project.value.files) {
      project.value.files = [];
    }
    
    // Add the file to our list
    project.value.files.unshift({
      name: selectedFile.value.name,
      size: formatFileSize(selectedFile.value.size),
      uploadedOn: new Date().toISOString().split('T')[0],
      uploadedBy: authStore.userFullName
    });
    
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    selectedFile.value = null;
    
    // Show success notification
    notificationsStore.success('File uploaded successfully!');
  } catch (err) {
    console.error('Error uploading file:', err);
    notificationsStore.error('Failed to upload file. Please try again.');
  } finally {
    uploadingFile.value = false;
    uploadProgress.value = 0;
  }
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Handle file download
const downloadFile = async (file) => {
  try {
    // Use MongoDB ObjectId for API calls
    const idToUse = mongoObjectId.value || project.value?._id;
    
    if (!idToUse) {
      throw new Error("No valid MongoDB ID available");
    }
    
    // In a real app, we'd call the API to download the file
    const response = await fetch(`/api/projects/${idToUse}/files/${encodeURIComponent(file.name)}`, {
      headers: {
        'Authorization': authStore.authHeader
      }
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    // Create blob from response and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    // Show info notification
    notificationsStore.info(`Downloading ${file.name}`);
  } catch (err) {
    console.error('Error downloading file:', err);
    notificationsStore.error(`Error downloading ${file.name}. Please try again.`);
  }
};

// Delete a file
const deleteFile = async (file, index) => {
  // Use notification confirm instead of browser confirm
  const confirmed = await notificationsStore.confirm(
    `Are you sure you want to delete ${file.name}?`, 
    {
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning'
    }
  );
  
  if (!confirmed) return;
  
  try {
    // Use MongoDB ObjectId for API calls
    const idToUse = mongoObjectId.value || project.value?._id;
    
    if (!idToUse) {
      throw new Error("No valid MongoDB ID available");
    }
    
    // API call to delete the file
    const response = await fetch(`/api/projects/${idToUse}/files/${encodeURIComponent(file.name)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authStore.authHeader
      }
    });
    
    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
    
    // Remove from local state
    project.value.files.splice(index, 1);
    notificationsStore.success('File deleted successfully');
  } catch (err) {
    console.error('Error deleting file:', err);
    notificationsStore.error(`Failed to delete ${file.name}. Please try again.`);
  }
};

// Toggle edit mode
const toggleEditMode = () => {
  if (isEditing.value) {
    // Cancel edit
    editedProject.value = { ...project.value };
  }
  isEditing.value = !isEditing.value;
};

// Save project changes
const saveProject = async () => {
  try {
    // Use MongoDB ObjectId for API calls
    const idToUse = mongoObjectId.value || project.value?._id;
    
    if (!idToUse) {
      throw new Error("No valid MongoDB ID available");
    }
    
    // Ensure externalLinks object exists before saving
    if (!editedProject.value.externalLinks) {
      editedProject.value.externalLinks = {
        githubRepo: '',
        figmaLink: '',
        jiraProject: ''
      };
    }
    
    console.log('Saving project with external links:', editedProject.value.externalLinks);
    
    // API call to update the project
    const response = await fetch(`/api/projects/${idToUse}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authStore.authHeader
      },
      body: JSON.stringify(editedProject.value)
    });
    
    if (!response.ok) {
      throw new Error(`Update failed: ${response.statusText}`);
    }
    
    // Update local state
    project.value = { ...editedProject.value };
    isEditing.value = false;
    notificationsStore.success('Project updated successfully');
  } catch (err) {
    console.error('Error updating project:', err);
    notificationsStore.error('Failed to update project. Please try again.');
  }
};

// Mark project as completed
const markProjectCompleted = async () => {
  // Use notification confirm instead of browser confirm
  const confirmed = await notificationsStore.confirm(
    'Are you sure you want to mark this project as completed?', 
    {
      confirmText: 'Mark Completed',
      cancelText: 'Cancel',
      type: 'info'
    }
  );
  
  if (!confirmed) return;
  
  try {
    // Set status to completed
    editedProject.value = { 
      ...project.value, 
      status: 'Completed',
      progress: 100
    };
    
    await saveProject();
    notificationsStore.success(`${project.value.name} marked as completed`);
  } catch (err) {
    console.error('Error marking project as completed:', err);
    notificationsStore.error('Failed to mark project as completed.');
  }
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

// Check permissions
const canEdit = computed(() => {
  return authStore.hasPermission('edit_project', projectId);
});

// Active tab state
const activeTab = ref('overview');

// Load project data on mount
onMounted(async () => {
  // Make sure users are loaded first, so they're available for the UserSelect components
  try {
    await usersStore.fetchUsers();
    console.log('Users loaded successfully:', usersStore.users.length);
  } catch (error) {
    console.error('Error loading users:', error);
  }
  
  // Then fetch the project
  fetchProject();
});

// Function to check if a URL is valid
const isValidUrl = (url) => {
  if (!url) return true; // Empty URLs are considered valid
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Function to open external link with validation
const openExternalLink = (url) => {
  if (!url) return;
  
  // Add https:// if protocol is missing
  let finalUrl = url;
  if (!/^https?:\/\//i.test(finalUrl)) {
    finalUrl = 'https://' + finalUrl;
  }
  
  window.open(finalUrl, '_blank');
};

// Compute if we have any external links
const hasExternalLinks = computed(() => {
  if (!project.value?.externalLinks) return false;
  const { githubRepo, figmaLink, jiraProject } = project.value.externalLinks;
  return !!(githubRepo || figmaLink || jiraProject);
});
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="bg-error-50 border border-error-200 text-error-800 rounded-md p-4 mb-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="mdi mdi-alert-circle text-xl text-error-500"></span>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium">Error</h3>
          <p class="mt-2 text-sm">{{ error }}</p>
          <button 
            @click="fetchProject" 
            class="mt-2 text-sm text-error-600 hover:text-error-800 font-medium underline"
          >
            Try Again
          </button>
        </div>
      </div>
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
                project.status === 'On Hold' ? 'bg-warning-100 text-warning-800' :
                project.status === 'Cancelled' ? 'bg-error-100 text-error-800' :
                'bg-neutral-100 text-neutral-800'
              ]"
            >
              {{ project.status }}
            </span>
          </div>
          <p class="text-neutral-600 mt-1">Project ID: {{ project.id }}</p>
        </div>
        
        <div class="flex mt-4 md:mt-0 space-x-3" v-if="canEdit">
          <button 
            v-if="!isEditing"
            @click="toggleEditMode" 
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 shadow-sm"
          >
            <span class="mdi mdi-pencil text-lg mr-2"></span>
            Edit Project
          </button>
          
          <button 
            v-if="isEditing"
            @click="saveProject" 
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md bg-success-600 text-white hover:bg-success-700 shadow-sm"
          >
            <span class="mdi mdi-content-save text-lg mr-2"></span>
            Save Changes
          </button>
          
          <button 
            v-if="isEditing"
            @click="toggleEditMode" 
            class="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md bg-white text-neutral-700 hover:bg-neutral-50"
          >
            <span class="mdi mdi-cancel text-lg mr-2"></span>
            Cancel
          </button>
          
          <button 
            v-if="!isEditing && project.status !== 'Completed' && canEdit"
            @click="markProjectCompleted"
             class="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md bg-white text-neutral-700 hover:bg-neutral-50"
          >
            <span class="mdi mdi-check-circle text-lg mr-2 text-success-600"></span>
            Mark Completed
          </button>
        </div>
      </div>
      
      <!-- Edit Form -->
      <div v-if="isEditing" class="bg-white rounded-lg shadow-card p-6 mb-6">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
          <span class="mdi mdi-pencil-outline text-xl text-primary-600"></span>
          Edit Project Details
        </h2>
        
        <!-- Navigation tabs for edit sections -->
        <div class="mb-6 border-b border-neutral-200">
          <nav class="flex -mb-px overflow-x-auto" aria-label="Edit sections">
            <button
              type="button"
              @click="activeTab = 'basic'"
              :class="[
                'mr-8 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === 'basic' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              ]"
            >
              <span class="mdi mdi-information-outline mr-1"></span>
              Basic Information
            </button>
            <button
              type="button"
              @click="activeTab = 'team'"
              :class="[
                'mr-8 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === 'team' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              ]"
            >
              <span class="mdi mdi-account-group mr-1"></span>
              Team Members
            </button>
            <button
              type="button"
              @click="activeTab = 'timeline'"
              :class="[
                'mr-8 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === 'timeline' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              ]"
            >
              <span class="mdi mdi-calendar-range mr-1"></span>
              Timeline
            </button>
            <button
              type="button"
              @click="activeTab = 'details'"
              :class="[
                'mr-8 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === 'details' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              ]"
            >
              <span class="mdi mdi-text-box-outline mr-1"></span>
              Additional Details
            </button>
            <button
              type="button"
              @click="activeTab = 'blockers'"
              :class="[
                'mr-8 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === 'blockers' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              ]"
            >
              <span class="mdi mdi-alert-circle-outline mr-1"></span>
              Blockers & Feedback
            </button>
            <button
              type="button"
              @click="activeTab = 'links'"
              :class="[
                'py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === 'links' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              ]"
            >
              <span class="mdi mdi-link-variant mr-1"></span>
              External Links
            </button>
          </nav>
        </div>
        
        <!-- Main Edit Tabs Content -->
        <div class="my-6">
          <!-- Basic Info Tab -->
          <div v-if="activeTab === 'basic'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Project Name -->
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <label for="project-name" class="block text-sm font-medium text-neutral-700 mb-2">
                  <span class="flex items-center gap-2">
                    <span class="mdi mdi-folder-outline text-primary-600"></span>
                    Project Name
                  </span>
                </label>
                <div class="relative">
                  <input 
                    id="project-name"
                    v-model="editedProject.name"
                    type="text"
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <!-- Company -->
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <label for="project-company" class="block text-sm font-medium text-neutral-700 mb-2">
                  <span class="flex items-center gap-2">
                    <span class="mdi mdi-office-building text-primary-600"></span>
                    Company
                  </span>
                </label>
                <div class="relative">
                  <input 
                    id="project-company"
                    v-model="editedProject.company"
                    type="text"
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Category -->
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <label for="project-category" class="block text-sm font-medium text-neutral-700 mb-2">
                  <span class="flex items-center gap-2">
                    <span class="mdi mdi-shape-outline text-primary-600"></span>
                    Category
                  </span>
                </label>
                <div class="relative">
                  <select 
                    id="project-category"
                    v-model="editedProject.category"
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Research">Research</option>
                    <option value="Support">Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <!-- Status -->
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <label for="project-status" class="block text-sm font-medium text-neutral-700 mb-2">
                  <span class="flex items-center gap-2">
                    <span class="mdi mdi-check-circle-outline text-primary-600"></span>
                    Status
                  </span>
                </label>
                <div class="relative">
                  <select 
                    id="project-status"
                    v-model="editedProject.status"
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option v-for="status in projectStatuses" :key="status" :value="status">{{ status }}</option>
                  </select>
                </div>
              </div>
              
              <!-- Priority -->
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <label for="project-priority" class="block text-sm font-medium text-neutral-700 mb-2">
                  <span class="flex items-center gap-2">
                    <span class="mdi mdi-flag text-primary-600"></span>
                    Priority
                  </span>
                </label>
                <div class="relative">
                  <select 
                    id="project-priority"
                    v-model="editedProject.priority"
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
              <div class="flex justify-between items-center mb-2">
                <label for="project-progress" class="block text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <span class="mdi mdi-chart-line text-primary-600"></span>
                  Progress
                </label>
                <div 
                  :class="[
                    'text-xs font-medium py-1 px-3 rounded-full', 
                    editedProject.progress >= 75 ? 'bg-success-100 text-success-800' : 
                    editedProject.progress >= 40 ? 'bg-accent-100 text-accent-800' : 
                    'bg-warning-100 text-warning-800'
                  ]"
                >
                  {{ editedProject.progress }}%
                </div>
              </div>
              <div class="w-full bg-neutral-200 rounded-full h-2.5 my-2">
                <div 
                  :class="[
                    'h-2.5 rounded-full transition-all duration-300',
                    editedProject.progress >= 75 ? 'bg-success-600' : 
                    editedProject.progress >= 40 ? 'bg-accent-600' : 
                    'bg-warning-600' 
                  ]"
                  :style="`width: ${editedProject.progress}%`"
                ></div>
              </div>
              <input 
                id="project-progress"
                v-model.number="editedProject.progress"
                type="range"
                min="0"
                max="100"
                step="5"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-4"
              />
              <div class="flex justify-between text-xs text-neutral-500 mt-1 px-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          
          <!-- Team Members Tab -->
          <div v-if="activeTab === 'team'" class="space-y-8">
            <!-- Project Lead - Enhanced with UserSelect component -->
            <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-primary-500 mb-6">
              <h3 class="text-md font-semibold text-neutral-800 mb-4 flex items-center">
                <span class="mdi mdi-account-tie text-xl text-primary-600 mr-2"></span>
                Project Leadership
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Project Lead -->
                <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                  <label class="block text-sm font-medium text-neutral-700 mb-3 flex items-center justify-between">
                    <span class="flex items-center gap-2">
                      <span class="mdi mdi-account text-primary-600"></span>
                      Project Lead
                    </span>
                    <span v-if="editedProject.assignedTo" class="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded">Assigned</span>
                  </label>
                  <!-- Using UserSelect component -->
                  <UserSelect
                    v-model="editedProject.assignedTo"
                    :required="true"
                    placeholder="Select project lead"
                    :filterRole="null"
                  />
                </div>
                
                <!-- Responsible Person -->
                <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                  <label class="block text-sm font-medium text-neutral-700 mb-3 flex items-center justify-between">
                    <span class="flex items-center gap-2">
                      <span class="mdi mdi-account-star text-primary-600"></span>
                      Responsible Person
                    </span>
                    <span v-if="editedProject.responsiblePerson" class="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded">Assigned</span>
                  </label>
                  <!-- Using UserSelect component -->
                  <UserSelect
                    v-model="editedProject.responsiblePerson"
                    placeholder="Select responsible person"
                    :filterRole="null"
                  />
                </div>
              </div>
            </div>
            
            <!-- Team Members - Enhanced with UserSelect component -->
            <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-accent-500 mb-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-md font-semibold text-neutral-800 flex items-center">
                  <span class="mdi mdi-account-multiple text-xl text-accent-600 mr-2"></span>
                  Team Members
                </h3>
                <span v-if="hasExistingTeamMembers" class="bg-accent-50 text-accent-700 text-xs px-2 py-1 rounded-md flex items-center">
                  <span class="mdi mdi-account-group mr-1"></span>
                  {{ editedProject.team.length }} Members
                </span>
              </div>
              
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <!-- Using UserSelect component -->
                <UserSelect
                  v-model="editedProject.team"
                  multiple
                  placeholder="Select team members"
                  :filterRole="null"
                />
              </div>
              
              <!-- Current team members display -->
              <div v-if="hasExistingTeamMembers" class="mt-6">
                <h4 class="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                  <span class="mdi mdi-account-check-outline text-accent-600"></span>
                  Current Team
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div 
                    v-for="(memberId, index) in editedProject.team" 
                    :key="`team-${index}`"
                    class="flex items-center p-3 bg-white border border-neutral-200 rounded-lg hover:shadow-sm transition-all duration-200"
                  >
                    <div class="w-8 h-8 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center mr-3">
                      <span class="mdi mdi-account text-lg"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium truncate">{{ getUserName(memberId) }}</div>
                    </div>
                    <button 
                      type="button" 
                      @click="editedProject.team = editedProject.team.filter((_, i) => i !== index)"
                      class="ml-2 text-neutral-400 hover:text-error-500 transition-colors"
                      title="Remove from team"
                    >
                      <span class="mdi mdi-close-circle"></span>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Empty state when no team members -->
              <div v-else class="text-center p-6 bg-neutral-50 rounded-lg border border-dashed border-neutral-200 mt-4">
                <span class="mdi mdi-account-group-outline text-4xl text-neutral-400 block mb-2"></span>
                <p class="text-neutral-500">No team members assigned yet</p>
                <p class="text-xs text-neutral-400 mt-1">Use the dropdown above to add team members</p>
              </div>
            </div>
            
            <!-- Developers - Enhanced with UserSelect component -->
            <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-success-500">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-md font-semibold text-neutral-800 flex items-center">
                  <span class="mdi mdi-laptop text-xl text-success-600 mr-2"></span>
                  Developers
                </h3>
                <span v-if="hasExistingDevelopers" class="bg-success-50 text-success-700 text-xs px-2 py-1 rounded-md flex items-center">
                  <span class="mdi mdi-laptop mr-1"></span>
                  {{ editedProject.developers.length }} Developers
                </span>
              </div>
              
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <!-- Using UserSelect component -->
                <UserSelect
                  v-model="editedProject.developers"
                  multiple
                  placeholder="Select developers"
                  :filterRole="null"
                />
              </div>
              
              <!-- Current developers display -->
              <div v-if="hasExistingDevelopers" class="mt-6">
                <h4 class="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                  <span class="mdi mdi-check-circle-outline text-success-600"></span>
                  Current Developers
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div 
                    v-for="(devId, index) in editedProject.developers" 
                    :key="`dev-${index}`"
                    class="flex items-center p-3 bg-white border border-neutral-200 rounded-lg hover:shadow-sm transition-all duration-200"
                  >
                    <div class="w-8 h-8 rounded-full bg-success-100 text-success-600 flex items-center justify-center mr-3">
                      <span class="mdi mdi-laptop text-lg"></span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-medium truncate">{{ getUserName(devId) }}</div>
                    </div>
                    <button 
                      type="button" 
                      @click="editedProject.developers = editedProject.developers.filter((_, i) => i !== index)"
                      class="ml-2 text-neutral-400 hover:text-error-500 transition-colors"
                      title="Remove developer"
                    >
                      <span class="mdi mdi-close-circle"></span>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Empty state when no developers -->
              <div v-else class="text-center p-6 bg-neutral-50 rounded-lg border border-dashed border-neutral-200 mt-4">
                <span class="mdi mdi-laptop-off text-4xl text-neutral-400 block mb-2"></span>
                <p class="text-neutral-500">No developers assigned yet</p>
                <p class="text-xs text-neutral-400 mt-1">Use the dropdown above to assign developers to this project</p>
              </div>
            </div>
          </div>
          
          <!-- Timeline Tab -->
          <div v-if="activeTab === 'timeline'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Start Date -->
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <label for="project-start-date" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <span class="mdi mdi-calendar-start text-primary-600"></span>
                  Start Date
                </label>
                <div class="relative">
                  <input 
                    id="project-start-date"
                    v-model="editedProject.startDate"
                    type="date"
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <!-- End Date -->
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <label for="project-end-date" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <span class="mdi mdi-calendar-end text-primary-600"></span>
                  End Date
                </label>
                <div class="relative">
                  <input 
                    id="project-end-date"
                    v-model="editedProject.endDate"
                    type="date"
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <!-- Initially Raised On -->
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <label for="project-raised-on" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <span class="mdi mdi-calendar-plus text-primary-600"></span>
                  Initially Raised On
                </label>
                <div class="relative">
                  <input 
                    id="project-raised-on"
                    v-model="editedProject.initiallyRaisedOn"
                    type="date"
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <!-- Deadline -->
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <label for="project-deadline" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <span class="mdi mdi-clock-alert-outline text-primary-600"></span>
                  Deadline
                </label>
                <div class="relative">
                  <input 
                    id="project-deadline"
                    v-model="editedProject.deadline"
                    type="date"
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
              
              <!-- Status Phase -->
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <label for="project-status-phase" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <span class="mdi mdi-playlist-check text-primary-600"></span>
                  Status Phase
                </label>
                <div class="relative">
                  <select 
                    id="project-status-phase"
                    v-model="editedProject.statusPhase"
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    <option value="">Select status phase</option>
                    <option value="Planning">Planning</option>
                    <option value="Development">Development</option>
                    <option value="Testing">Testing</option>
                    <option value="Deployment">Deployment</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              
              <!-- Pending Days -->
              <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                <label for="project-pending" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <span class="mdi mdi-calendar-clock text-primary-600"></span>
                  Pending Days
                </label>
                <div class="flex items-center">
                  <input 
                    id="project-pending"
                    v-model.number="editedProject.pendingDays"
                    type="number"
                    min="0"
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <span class="ml-2 text-neutral-500">days</span>
                </div>
                <div class="text-xs text-neutral-500 mt-2">
                  <span class="mdi mdi-information-outline mr-1"></span>
                  Auto-calculated from initially raised date
                </div>
              </div>
            </div>
            
            <!-- Timeline visualization -->
            <div class="bg-white rounded-xl shadow-md p-6 border border-neutral-100">
              <h3 class="text-md font-semibold text-neutral-800 mb-3">Timeline Overview</h3>
              <div class="relative pt-6 pb-2">
                <div class="absolute left-0 right-0 top-0 flex justify-between px-6">
                  <div class="text-xs text-neutral-500">Start</div>
                  <div class="text-xs text-neutral-500">End</div>
                </div>
                <div class="h-3 bg-neutral-100 rounded-full overflow-hidden relative">
                  <div
                    class="absolute h-full bg-primary-500 rounded-full"
                    :style="`width: ${editedProject.progress}%`"
                  ></div>
                </div>
                <div class="flex justify-between mt-2">
                  <div class="text-xs font-medium">{{ editedProject.startDate }}</div>
                  <div class="text-xs font-medium">{{ editedProject.endDate }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Additional Details Tab -->
          <div v-if="activeTab === 'details'" class="space-y-6">
            <!-- Remarks -->
            <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
              <label for="project-remarks" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <span class="mdi mdi-message-text-outline text-primary-600"></span>
                Remarks
              </label>
              <div class="relative">
                <textarea 
                  id="project-remarks"
                  v-model="editedProject.remarks"
                  rows="4"
                  placeholder="Project remarks or description"
                  class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                ></textarea>
              </div>
            </div>
            
            <!-- Notes -->
            <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
              <label for="project-notes" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <span class="mdi mdi-notebook-outline text-primary-600"></span>
                Notes
              </label>
              <div class="relative">
                <textarea 
                  id="project-notes"
                  v-model="editedProject.notes"
                  rows="4"
                  placeholder="Additional project notes"
                  class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                ></textarea>
              </div>
            </div>
            
            <!-- Comments -->
            <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
              <label for="project-comments" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                <span class="mdi mdi-comment-text-outline text-primary-600"></span>
                Comments
              </label>
              <div class="relative">
                <textarea 
                  id="project-comments"
                  v-model="editedProject.comments"
                  rows="4"
                  placeholder="General project comments"
                  class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                ></textarea>
              </div>
            </div>
          </div>
          
          <!-- Blockers Tab -->
          <div v-if="activeTab === 'blockers'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Blockers -->
              <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-error-500">
                <label for="project-blockers" class="block text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                  <span class="mdi mdi-alert-circle text-error-600"></span>
                  Blockers
                </label>
                <div class="relative">
                  <textarea 
                    id="project-blockers"
                    v-model="editedProject.blockers"
                    rows="6"
                    placeholder="List any blockers preventing progress..."
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  ></textarea>
                  <span class="absolute top-3 right-3 text-error-400 text-lg">
                    <span class="mdi mdi-alert-circle"></span>
                  </span>
                </div>
              </div>
              
              <!-- Feedback for Blockers -->
              <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-accent-500">
                <label for="project-feedback" class="block text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                  <span class="mdi mdi-message-reply text-accent-600"></span>
                  Feedback for Blockers
                </label>
                <div class="relative">
                  <textarea 
                    id="project-feedback"
                    v-model="editedProject.feedbackForBlockers"
                    rows="6"
                    placeholder="Add feedback about project blockers..."
                    class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  ></textarea>
                  <span class="absolute top-3 right-3 text-accent-400 text-lg">
                    <span class="mdi mdi-message-reply"></span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- External Links Tab - New Tab -->
          <div v-if="activeTab === 'links'" class="space-y-6">
            <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <h3 class="text-md font-semibold text-neutral-800 mb-4 flex items-center">
                <span class="mdi mdi-link-variant text-xl text-purple-600 mr-2"></span>
                External Project Links
              </h3>
              
              <div class="grid grid-cols-1 gap-6">
                <!-- GitHub Repository Link -->
                <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                  <label for="project-github" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                    <span class="mdi mdi-github text-xl text-neutral-800"></span>
                    GitHub Repository
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                      <span class="mdi mdi-link"></span>
                    </span>
                    <input 
                      id="project-github"
                      v-model="editedProject.externalLinks.githubRepo"
                      type="text"
                      placeholder="https://github.com/username/repository"
                      class="pl-10 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <p class="text-xs text-neutral-500 mt-2">
                    <span class="mdi mdi-information-outline mr-1"></span>
                    Enter the full GitHub repository URL
                  </p>
                </div>
                
                <!-- Figma Link -->
                <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                  <label for="project-figma" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                    <span class="mdi mdi-figma text-xl text-pink-600"></span>
                    Figma Design Link
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                      <span class="mdi mdi-link"></span>
                    </span>
                    <input 
                      id="project-figma"
                      v-model="editedProject.externalLinks.figmaLink"
                      type="text"
                      placeholder="https://www.figma.com/file/..."
                      class="pl-10 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <p class="text-xs text-neutral-500 mt-2">
                    <span class="mdi mdi-information-outline mr-1"></span>
                    Enter the Figma design file link
                  </p>
                </div>
                
                <!-- Jira Project Link -->
                <div class="bg-neutral-50 rounded-lg p-5 transition-all duration-200 hover:shadow-sm">
                  <label for="project-jira" class="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                    <span class="mdi mdi-jira text-xl text-blue-600"></span>
                    Jira Project Link
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                      <span class="mdi mdi-link"></span>
                    </span>
                    <input 
                      id="project-jira"
                      v-model="editedProject.externalLinks.jiraProject"
                      type="text"
                      placeholder="https://your-domain.atlassian.net/jira/..."
                      class="pl-10 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <p class="text-xs text-neutral-500 mt-2">
                    <span class="mdi mdi-information-outline mr-1"></span>
                    Enter the Jira project board link
                  </p>
                </div>
              </div>
              
              <!-- Preview of links -->
              <div class="mt-6 bg-white rounded-lg border border-neutral-200 p-4">
                <h4 class="text-sm font-medium text-neutral-700 mb-3">Preview</h4>
                <div class="space-y-2">
                  <div class="flex items-center" v-if="editedProject.externalLinks.githubRepo">
                    <span class="mdi mdi-github text-xl mr-2"></span>
                    <span class="text-sm text-primary-600 truncate">{{ editedProject.externalLinks.githubRepo }}</span>
                  </div>
                  <div class="flex items-center" v-if="editedProject.externalLinks.figmaLink">
                    <span class="mdi mdi-figma text-xl mr-2 text-pink-600"></span>
                    <span class="text-sm text-primary-600 truncate">{{ editedProject.externalLinks.figmaLink }}</span>
                  </div>
                  <div class="flex items-center" v-if="editedProject.externalLinks.jiraProject">
                    <span class="mdi mdi-jira text-xl mr-2 text-blue-600"></span>
                    <span class="text-sm text-primary-600 truncate">{{ editedProject.externalLinks.jiraProject }}</span>
                  </div>
                  <div class="text-center text-sm text-neutral-500 py-2" v-if="!editedProject.externalLinks.githubRepo && !editedProject.externalLinks.figmaLink && !editedProject.externalLinks.jiraProject">
                    No external links added yet
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons - Sticky to bottom of form -->
        <div class="sticky bottom-0 bg-white p-5 border-t border-neutral-200 flex justify-end gap-3 -mx-6 -mb-6 mt-6 rounded-b-lg">
          <button 
            @click="toggleEditMode" 
            class="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md bg-white text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <span class="mdi mdi-close text-lg mr-2"></span>
            Cancel
          </button>
          
          <button 
            @click="saveProject" 
            class="inline-flex items-center px-8 py-2 border border-transparent text-sm font-medium rounded-md bg-success-600 text-white hover:bg-success-700 shadow-sm transition-all duration-200"
          >
            <span class="mdi mdi-content-save text-lg mr-2"></span>
            Save Project
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
            <div class="text-lg text-neutral-800">{{ getUserName(project.assignedTo) }}</div>
          </div>
          <div v-if="project.team && project.team.length" class="text-sm text-neutral-600">
            <div class="font-medium mb-1">Team Members:</div>
            <div v-for="(member, index) in project.team" :key="index" class="flex items-center mb-1">
              <span class="mdi mdi-account text-lg mr-2 text-neutral-500"></span>
              {{ getUserName(member) }}
            </div>
          </div>
          <div v-else class="text-neutral-600 text-sm italic">No team members assigned</div>
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
            @click="activeTab = 'team'"
            :class="[
              'py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
              activeTab === 'team' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            ]"
          >
            Team
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
          <button 
            v-if="hasExternalLinks"
            @click="activeTab = 'links'"
            :class="[
              'py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
              activeTab === 'links' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            ]"
          >
            <span class="mdi mdi-link-variant mr-1"></span>
            External Links
          </button>
        </nav>
      </div>
      
      <!-- Tab Content -->
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="bg-white rounded-lg shadow-card p-6">
        <h2 class="text-lg font-medium text-neutral-900 mb-4">Project Details</h2>
        
        <!-- Main Info Cards with Animation -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <!-- Main Project Info -->
          <div class="bg-gradient-to-br from-white to-neutral-50 rounded-xl shadow-lg p-5 border-l-4 border-primary-500 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-md font-semibold text-neutral-900 mb-3">Basic Information</h3>
                <div class="space-y-2">
                  <div class="flex items-center">
                    <span class="mdi mdi-office-building text-primary-600 mr-2"></span>
                    <span class="text-sm text-neutral-600">Company:</span>
                    <span class="text-sm font-medium text-neutral-800 ml-2">{{ project.company || 'Not specified' }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="mdi mdi-shape-outline text-primary-600 mr-2"></span>
                    <span class="text-sm text-neutral-600">Category:</span>
                    <span class="text-sm font-medium text-neutral-800 ml-2">{{ project.category }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="mdi mdi-flag text-primary-600 mr-2"></span>
                    <span class="text-sm text-neutral-600">Priority:</span>
                    <span :class="[
                      'text-sm font-medium ml-2 px-2 py-0.5 rounded-full text-xs',
                      project.priority === 'Urgent' ? 'bg-error-100 text-error-700' :
                      project.priority === 'High' ? 'bg-warning-100 text-warning-700' :
                      project.priority === 'Medium' ? 'bg-accent-100 text-accent-700' :
                      'bg-success-100 text-success-700'
                    ]">{{ project.priority }}</span>
                  </div>
                </div>
              </div>
              <div class="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span class="mdi mdi-information-outline text-xl text-primary-600"></span>
              </div>
            </div>
          </div>
          
          <!-- Status Info -->
          <div class="bg-gradient-to-br from-white to-neutral-50 rounded-xl shadow-lg p-5 border-l-4 border-accent-500 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-md font-semibold text-neutral-900 mb-3">Status Details</h3>
                <div class="space-y-2">
                  <div class="flex items-center">
                    <span class="mdi mdi-playlist-check text-accent-600 mr-2"></span>
                    <span class="text-sm text-neutral-600">Status Phase:</span>
                    <span class="text-sm font-medium text-neutral-800 ml-2">{{ project.statusPhase || 'Not specified' }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="mdi mdi-calendar-clock text-accent-600 mr-2"></span>
                    <span class="text-sm text-neutral-600">Pending Days:</span>
                    <span class="text-sm font-medium text-neutral-800 ml-2">{{ project.pendingDays || 0 }} days</span>
                  </div>
                  <div class="flex items-center">
                    <span class="mdi mdi-calendar-plus text-accent-600 mr-2"></span>
                    <span class="text-sm text-neutral-600">Initially Raised:</span>
                    <span class="text-sm font-medium text-neutral-800 ml-2">{{ project.initiallyRaisedOn || project.startDate }}</span>
                  </div>
                </div>
              </div>
              <div class="h-12 w-12 rounded-full bg-accent-100 flex items-center justify-center">
                <span class="mdi mdi-check-circle-outline text-xl text-accent-600"></span>
              </div>
            </div>
          </div>
          
          <!-- Responsibility Info -->
          <div class="bg-gradient-to-br from-white to-neutral-50 rounded-xl shadow-lg p-5 border-l-4 border-success-500 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-md font-semibold text-neutral-900 mb-3">Responsibility</h3>
                <div class="space-y-2">
                  <div class="flex items-center">
                    <span class="mdi mdi-account-star text-success-600 mr-2"></span>
                    <span class="text-sm text-neutral-600">Responsible Person:</span>
                    <span class="text-sm font-medium text-neutral-800 ml-2">{{ project.responsiblePerson || project.assignedTo }}</span>
                  </div>
                  <div class="flex items-center">
                    <span class="mdi mdi-laptop text-success-600 mr-2"></span>
                    <span class="text-sm text-neutral-600">Developers:</span>
                    <span class="text-sm font-medium text-neutral-800 ml-2">{{ project.developers ? project.developers.length : 0 }} assigned</span>
                  </div>
                  <div class="flex items-center">
                    <span class="mdi mdi-clock-alert-outline text-success-600 mr-2"></span>
                    <span class="text-sm text-neutral-600">Deadline:</span>
                    <span class="text-sm font-medium text-neutral-800 ml-2">{{ project.deadline || project.endDate }}</span>
                  </div>
                </div>
              </div>
              <div class="h-12 w-12 rounded-full bg-success-100 flex items-center justify-center">
                <span class="mdi mdi-account-group text-xl text-success-600"></span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Project Description Details -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-xl shadow-md border border-neutral-100 p-5 transition-all duration-300 hover:shadow-lg">
            <h3 class="text-md font-semibold text-neutral-800 mb-3 flex items-center">
              <span class="mdi mdi-message-text-outline text-lg text-primary-600 mr-2"></span>
              Remarks
            </h3>
            <p class="text-neutral-700 bg-neutral-50 p-3 rounded-md">{{ project.remarks || 'No remarks provided' }}</p>
          </div>
          
          <div class="bg-white rounded-xl shadow-md border border-neutral-100 p-5 transition-all duration-300 hover:shadow-lg">
            <h3 class="text-md font-semibold text-neutral-800 mb-3 flex items-center">
              <span class="mdi mdi-clipboard-text-outline text-lg text-primary-600 mr-2"></span>
              Notes
            </h3>
            <p class="text-neutral-700 bg-neutral-50 p-3 rounded-md">{{ project.notes || 'No notes provided' }}</p>
          </div>
        </div>
        
        <!-- Blockers & Feedback -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-xl shadow-md border border-neutral-100 p-5 transition-all duration-300 hover:shadow-lg">
            <h3 class="text-md font-semibold text-neutral-800 mb-3 flex items-center">
              <span class="mdi mdi-alert-circle text-lg text-error-600 mr-2"></span>
              Blockers
            </h3>
            <p class="text-neutral-700 bg-neutral-50 p-3 rounded-md">{{ project.blockers || 'No blockers reported' }}</p>
          </div>
          
          <div class="bg-white rounded-xl shadow-md border border-neutral-100 p-5 transition-all duration-300 hover:shadow-lg">
            <h3 class="text-md font-semibold text-neutral-800 mb-3 flex items-center">
              <span class="mdi mdi-message-reply text-lg text-accent-600 mr-2"></span>
              Feedback on Blockers
            </h3>
            <p class="text-neutral-700 bg-neutral-50 p-3 rounded-md">{{ project.feedbackForBlockers || 'No feedback provided' }}</p>
          </div>
        </div>
        
        <!-- Comments -->
        <div class="bg-white rounded-xl shadow-md border border-neutral-100 p-5 transition-all duration-300 hover:shadow-lg">
          <h3 class="text-md font-semibold text-neutral-800 mb-3 flex items-center">
            <span class="mdi mdi-message-processing-outline text-lg text-primary-600 mr-2"></span>
            Comments
          </h3>
          <p class="text-neutral-700 bg-neutral-50 p-3 rounded-md">{{ project.comments || 'No comments added' }}</p>
        </div>
        
        <!-- External Links Section - Add before the Team Information section -->
        <div v-if="hasExternalLinks" class="mt-8">
          <h3 class="text-md font-semibold text-neutral-800 mb-3 flex items-center">
            <span class="mdi mdi-link-variant text-lg text-purple-600 mr-2"></span>
            External Resources
          </h3>
          
          <div class="bg-white rounded-xl shadow-md border border-neutral-100 p-5 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- GitHub Repository -->
              <div v-if="project.externalLinks.githubRepo" 
                  class="bg-neutral-50 p-4 rounded-lg border border-l-4 border-l-neutral-800 transition-all duration-200 hover:shadow-md"
                  @click="openExternalLink(project.externalLinks.githubRepo)"
                  role="link"
                  tabindex="0"
                  :title="project.externalLinks.githubRepo"
              >
                <div class="flex items-center">
                  <div class="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center mr-3">
                    <span class="mdi mdi-github text-xl text-white"></span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-neutral-900">GitHub Repository</div>
                    <div class="text-xs text-neutral-500 truncate max-w-[180px]">{{ project.externalLinks.githubRepo }}</div>
                  </div>
                </div>
              </div>
              
              <!-- Figma Design -->
              <div v-if="project.externalLinks.figmaLink" 
                  class="bg-neutral-50 p-4 rounded-lg border border-l-4 border-l-pink-500 transition-all duration-200 hover:shadow-md"
                  @click="openExternalLink(project.externalLinks.figmaLink)"
                  role="link"
                  tabindex="0"
                  :title="project.externalLinks.figmaLink"
              >
                <div class="flex items-center">
                  <div class="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center mr-3">
                    <span class="mdi mdi-figma text-xl text-pink-600"></span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-neutral-900">Figma Design</div>
                    <div class="text-xs text-neutral-500 truncate max-w-[180px]">{{ project.externalLinks.figmaLink }}</div>
                  </div>
                </div>
              </div>
              
              <!-- Jira Project -->
              <div v-if="project.externalLinks.jiraProject" 
                  class="bg-neutral-50 p-4 rounded-lg border border-l-4 border-l-blue-500 transition-all duration-200 hover:shadow-md"
                  @click="openExternalLink(project.externalLinks.jiraProject)"
                  role="link"
                  tabindex="0"
                  :title="project.externalLinks.jiraProject"
              >
                <div class="flex items-center">
                  <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span class="mdi mdi-jira text-xl text-blue-600"></span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-neutral-900">Jira Project</div>
                    <div class="text-xs text-neutral-500 truncate max-w-[180px]">{{ project.externalLinks.jiraProject }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Team Information Section -->
        <div class="mt-8">
          <h3 class="text-md font-semibold text-neutral-800 mb-3 flex items-center">
            <span class="mdi mdi-account-group text-lg text-primary-600 mr-2"></span>
            Team Information
          </h3>
          
          <!-- Team Members -->
          <div class="bg-white rounded-xl shadow-md border border-neutral-100 p-5 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-neutral-600 mb-2">Lead & Assignee</h4>
                <div class="bg-neutral-50 p-4 rounded-lg">
                  <div class="flex items-center mb-3">
                    <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <span class="mdi mdi-account text-xl text-primary-600"></span>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-neutral-900">{{ getUserName(project.assignedTo) }}</div>
                      <div class="text-xs text-neutral-500">Project Lead</div>
                    </div>
                  </div>
                  
                  <div v-if="project.responsiblePerson && project.responsiblePerson !== project.assignedTo" class="flex items-center">
                    <div class="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center mr-3">
                      <span class="mdi mdi-account-star text-xl text-accent-600"></span>
                    </div>
                    <div>
                      <div class="text-sm font-medium text-neutral-900">{{ getUserName(project.responsiblePerson) }}</div>
                      <div class="text-xs text-neutral-500">Responsible Person</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 class="text-sm font-medium text-neutral-600 mb-2">Team Members</h4>
                <div class="bg-neutral-50 p-4 rounded-lg">
                  <div v-if="project.team && project.team.length" class="flex flex-wrap gap-2">
                    <div v-for="(member, index) in project.team" :key="index" 
                      class="px-3 py-1 bg-white rounded-full border border-neutral-200 text-sm flex items-center">
                      <span class="mdi mdi-account text-xs text-neutral-500 mr-1"></span>
                      {{ getUserName(member) }}
                    </div>
                  </div>
                  <div v-else class="text-sm text-neutral-500 italic">No team members assigned</div>
                </div>
              </div>
            </div>
            
            <!-- Developers Section -->
            <div v-if="project.developers && project.developers.length" class="mt-4">
              <h4 class="text-sm font-medium text-neutral-600 mb-2">Developers</h4>
              <div class="bg-neutral-50 p-4 rounded-lg">
                <div class="flex flex-wrap gap-2">
                  <div v-for="(dev, index) in project.developers" :key="index"
                    class="px-3 py-1 bg-white rounded-full border border-neutral-200 text-sm flex items-center">
                    <span class="mdi mdi-laptop text-xs text-neutral-500 mr-1"></span>
                    {{ getUserName(dev) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Timeline Section -->
        <div class="mt-8">
          <h3 class="text-md font-semibold text-neutral-800 mb-3 flex items-center">
            <span class="mdi mdi-calendar-range text-lg text-primary-600 mr-2"></span>
            Timeline Information
          </h3>
          
          <div class="bg-white rounded-xl shadow-md border border-neutral-100 p-5 mt-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Timeline Visualization -->
              <div class="md:col-span-3">
                <div class="relative pt-6 pb-2">
                  <div class="absolute left-0 right-0 top-0 flex justify-between px-6">
                    <div class="text-xs text-neutral-500">Start</div>
                    <div class="text-xs text-neutral-500">End</div>
                  </div>
                  <div class="h-3 bg-neutral-100 rounded-full overflow-hidden relative">
                    <div
                      class="absolute h-full bg-primary-500 rounded-full"
                      :style="{
                        width: isOverdue ? '100%' : `${project.progress}%`,
                        backgroundColor: isOverdue ? 'var(--color-error-600)' : undefined
                      }"
                    ></div>
                  </div>
                  <div class="flex justify-between mt-2">
                    <div class="text-xs font-medium">{{ project.startDate }}</div>
                    <div :class="['text-xs font-medium', isOverdue ? 'text-error-600' : '']">
                      {{ project.endDate }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Date Information -->
              <div class="bg-neutral-50 p-4 rounded-lg flex flex-col justify-between">
                <h4 class="text-sm font-medium text-neutral-600 mb-2">Project Start</h4>
                <div>
                  <div class="text-md font-bold text-neutral-800">{{ project.startDate }}</div>
                  <div class="text-xs text-neutral-500 mt-1">Initially Raised: {{ project.initiallyRaisedOn || project.startDate }}</div>
                </div>
              </div>
              
              <div class="bg-neutral-50 p-4 rounded-lg flex flex-col justify-between">
                <h4 class="text-sm font-medium text-neutral-600 mb-2">Project Deadline</h4>
                <div>
                  <div :class="['text-md font-bold', isOverdue ? 'text-error-700' : 'text-neutral-800']">
                    {{ project.deadline || project.endDate }}
                  </div>
                  <div class="text-xs text-neutral-500 mt-1">Expected End Date: {{ project.endDate }}</div>
                </div>
              </div>
              
              <div class="bg-neutral-50 p-4 rounded-lg flex flex-col justify-between">
                <h4 class="text-sm font-medium text-neutral-600 mb-2">Time Tracking</h4>
                <div class="flex items-center">
                  <div class="text-2xl font-bold mr-2" :class="[isOverdue ? 'text-error-600' : 'text-success-600']">
                    {{ Math.abs(daysRemaining) }}
                  </div>
                  <div :class="[
                    'text-sm px-2 py-1 rounded-full',
                    isOverdue ? 'bg-error-100 text-error-800' : 'bg-success-100 text-success-800'
                  ]">
                    {{ isOverdue ? 'Days Overdue' : 'Days Remaining' }}
                  </div>
                </div>
                <div class="text-xs text-neutral-500 mt-2">Pending: {{ project.pendingDays || 0 }} days</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Updates Tab -->
      <div v-if="activeTab === 'updates'" class="bg-white rounded-lg shadow-card p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-neutral-900">Project Updates</h2>
        </div>
        
        <!-- Add Update Form -->
        <div v-if="canEdit" class="mb-6 bg-neutral-50 p-4 rounded-md">
          <h3 class="text-md font-medium text-neutral-800 mb-2">Add New Update</h3>
          <div class="mb-3">
            <textarea 
              v-model="newUpdate" 
              placeholder="Enter project update..." 
              rows="3" 
              class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              :disabled="isSubmittingUpdate"
            ></textarea>
          </div>
          <div class="flex justify-end">
            <button 
              @click="addUpdate" 
              :disabled="!newUpdate.trim() || isSubmittingUpdate"
              :class="[
                'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm',
                (!newUpdate.trim() || isSubmittingUpdate)
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              ]"
            >
              <span v-if="isSubmittingUpdate" class="mdi mdi-loading mdi-spin text-lg mr-2"></span>
              <span v-else class="mdi mdi-plus text-lg mr-2"></span>
              {{ isSubmittingUpdate ? 'Submitting...' : 'Add Update' }}
            </button>
          </div>
        </div>
        
        <!-- Updates List -->
        <div v-if="project.updates && project.updates.length > 0" class="space-y-4">
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
        
        <!-- No Updates -->
        <div v-else class="text-center py-8 text-neutral-500">
          <span class="mdi mdi-message-text-outline text-4xl block mb-2"></span>
          <p class="text-lg font-medium">No updates yet</p>
          <p v-if="canEdit" class="text-sm mt-1">Add an update to keep the team informed about the project's progress.</p>
        </div>
      </div>
      
      <!-- Files Tab -->
      <div v-if="activeTab === 'files'" class="bg-white rounded-lg shadow-card p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-neutral-900">Project Files</h2>
          <button 
            v-if="canEdit"
            @click="$refs.fileInput.click()" 
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700"
            :disabled="uploadingFile"
          >
            <span v-if="uploadingFile" class="mdi mdi-loading mdi-spin text-lg mr-1"></span>
            <span v-else class="mdi mdi-upload text-lg mr-1"></span>
            {{ uploadingFile ? 'Uploading...' : 'Upload File' }}
          </button>
          
          <!-- Hidden file input -->
          <input 
            ref="fileInput" 
            type="file" 
            class="hidden" 
            @change="handleFileSelect"
          />
        </div>
        
        <!-- File upload progress -->
        <div v-if="uploadingFile" class="mb-4">
          <div class="w-full bg-neutral-200 rounded-full h-2.5 mb-1">
            <div 
              class="bg-primary-600 h-2.5 rounded-full"
              :style="`width: ${uploadProgress}%`"
            ></div>
          </div>
          <p class="text-sm text-neutral-600">Uploading {{ selectedFile?.name }}... {{ uploadProgress }}%</p>
        </div>
        
        <!-- Selected file - awaiting upload -->
        <div v-if="selectedFile && !uploadingFile" class="mb-4 bg-neutral-50 p-3 rounded-md flex items-center justify-between">
          <div class="flex items-center">
            <span class="mdi mdi-file-document-outline text-xl text-primary-600 mr-2"></span>
            <span class="text-sm">{{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</span>
          </div>
          <div class="flex space-x-2">
            <button 
              @click="uploadFile" 
              class="text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
            >
              Upload
            </button>
            <button 
              @click="selectedFile = null" 
              class="text-sm bg-neutral-200 text-neutral-800 px-3 py-1 rounded hover:bg-neutral-300"
            >
              Cancel
            </button>
          </div>
        </div>
        
        <!-- Files table -->
        <div v-if="project.files && project.files.length > 0" class="overflow-x-auto">
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
                  <button 
                    v-if="canEdit"
                    @click="deleteFile(file, index)" 
                    class="text-neutral-600 hover:text-neutral-900"
                  >
                    <span class="mdi mdi-delete"></span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- No Files -->
        <div v-else class="text-center py-8 text-neutral-500">
          <span class="mdi mdi-file-document-outline text-4xl block mb-2"></span>
          <p class="text-lg font-medium">No files yet</p>
          <p v-if="canEdit" class="text-sm mt-1">Upload files to share project documents with the team.</p>
        </div>
      </div>

      <!-- Team Tab -->
      <div v-if="activeTab === 'team'" class="bg-white rounded-lg shadow-card p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-lg font-medium text-neutral-900 flex items-center">
            Project Team Members
          </h2>
          
          <button 
            v-if="canEdit && !isEditing"
            @click="toggleEditMode"
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700"
          >
            <span class="mdi mdi-account-edit mr-1"></span>
            Edit Team
          </button>
        </div>
        
        <!-- Team leadership section -->
        <div class="mb-8">
          <h3 class="text-md font-medium text-neutral-700 mb-4 pb-2 border-b border-neutral-200">
            Leadership
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Project Lead Card -->
            <div class="bg-white rounded-xl shadow-sm border border-neutral-100 p-5 transition-all duration-300 hover:shadow-md">
              <div class="flex items-center">
                <div class="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span class="mdi mdi-account-tie text-2xl text-primary-600"></span>
                </div>
                <div class="ml-4">
                  <h4 class="font-medium text-neutral-900">{{ getUserName(project.assignedTo) || 'No project lead assigned' }}</h4>
                  <div class="flex items-center mt-1">
                    <span class="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full">Project Lead</span>
                  </div>
                  <p class="text-sm text-neutral-500 mt-2">
                    <span class="mdi mdi-check-decagram text-primary-500 mr-1"></span>
                    Overall project responsibility
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Responsible Person Card -->
            <div class="bg-white rounded-xl shadow-sm border border-neutral-100 p-5 transition-all duration-300 hover:shadow-md">
              <div class="flex items-center">
                <div class="h-16 w-16 rounded-full bg-accent-100 flex items-center justify-center flex-shrink-0">
                  <span class="mdi mdi-account-star text-2xl text-accent-600"></span>
                </div>
                <div class="ml-4">
                  <h4 class="font-medium text-neutral-900">{{ getUserName(project.responsiblePerson) || 'Not assigned' }}</h4>
                  <div class="flex items-center mt-1">
                    <span class="bg-accent-100 text-accent-800 text-xs px-2 py-0.5 rounded-full">Responsible Person</span>
                  </div>
                  <p class="text-sm text-neutral-500 mt-2">
                    <span class="mdi mdi-clipboard-check text-accent-500 mr-1"></span>
                    Day-to-day project management
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Team members section -->
        <div class="mb-8">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-md font-medium text-neutral-700 pb-2 border-b border-neutral-200">
              Team Members
              <span v-if="project.team && project.team.length > 0" class="ml-2 px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs rounded-full">
                {{ project.team.length }}
              </span>
            </h3>
            
            <div v-if="project.team && project.team.length > 0" class="text-sm">
              <div class="flex items-center gap-1 text-neutral-500">
                <span class="mdi mdi-account-group"></span>
                <span>{{ project.team.length }} {{ project.team.length === 1 ? 'member' : 'members' }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="project.team && project.team.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Team member card -->
            <div v-for="(member, index) in project.team" :key="index" 
              class="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 hover:shadow-md transition-all duration-300">
              <div class="flex items-center">
                <div class="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <span class="mdi mdi-account text-xl text-neutral-600"></span>
                </div>
                <div class="ml-3 flex-1 min-w-0">
                  <div class="font-medium text-neutral-900 truncate">{{ getUserName(member) }}</div>
                  <div class="text-xs text-neutral-500 mt-1">Team Member</div>
                </div>
                <div v-if="canEdit && isEditing" 
                  class="ml-2 p-1 rounded-full hover:bg-neutral-100 cursor-pointer" 
                  title="Remove member"
                >
                  <span class="mdi mdi-close text-neutral-500 hover:text-error-600"></span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- No team members placeholder -->
          <div v-else class="bg-neutral-50 rounded-lg p-8 text-center">
            <div class="h-16 w-16 rounded-full bg-neutral-200 mx-auto flex items-center justify-center mb-3">
              <span class="mdi mdi-account-group text-2xl text-neutral-400"></span>
            </div>
            <h4 class="text-neutral-600 font-medium mb-2">No Team Members Assigned</h4>
            <p class="text-neutral-500 text-sm max-w-md mx-auto">
              Team members contribute to the project and help achieve project goals.
              {{ canEdit ? 'Click "Edit Team" to add team members to this project.' : '' }}
            </p>
          </div>
        </div>
        
        <!-- Developers section -->
        <div class="mb-8">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-md font-medium text-neutral-700 pb-2 border-b border-neutral-200">
              Developers
              <span v-if="project.developers && project.developers.length > 0" class="ml-2 px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs rounded-full">
                {{ project.developers.length }}
              </span>
            </h3>
          </div>
          
          <div v-if="project.developers && project.developers.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Developer card -->
            <div v-for="(developer, index) in project.developers" :key="index" 
              class="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 hover:shadow-md transition-all duration-300">
              <div class="flex items-center">
                <div class="h-12 w-12 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                  <span class="mdi mdi-laptop text-xl text-success-600"></span>
                </div>
                <div class="ml-3 flex-1 min-w-0">
                  <div class="font-medium text-neutral-900 truncate">{{ getUserName(developer) }}</div>
                  <div class="text-xs text-neutral-500 mt-1">Developer</div>
                </div>
                <div v-if="canEdit && isEditing" 
                  class="ml-2 p-1 rounded-full hover:bg-neutral-100 cursor-pointer" 
                  title="Remove developer"
                >
                  <span class="mdi mdi-close text-neutral-500 hover:text-error-600"></span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- No developers placeholder -->
          <div v-else class="bg-neutral-50 rounded-lg p-8 text-center">
            <div class="h-16 w-16 rounded-full bg-neutral-200 mx-auto flex items-center justify-center mb-3">
              <span class="mdi mdi-laptop text-2xl text-neutral-400"></span>
            </div>
            <h4 class="text-neutral-600 font-medium mb-2">No Developers Assigned</h4>
            <p class="text-neutral-500 text-sm max-w-md mx-auto">
              Developers implement the technical aspects of the project.
              {{ canEdit ? 'Click "Edit Team" to add developers to this project.' : '' }}
            </p>
          </div>
        </div>
        
        <!-- Team Statistics -->
        <div class="bg-white rounded-xl shadow-md border border-neutral-100 p-5">
          <h3 class="text-md font-medium text-neutral-700 mb-4 flex items-center">
            <span class="mdi mdi-chart-areaspline text-primary-600 mr-2"></span>
            Team Statistics
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-neutral-50 rounded-lg p-4">
              <div class="text-sm text-neutral-500 mb-1">Total Team Size</div>
              <div class="text-2xl font-bold text-neutral-800">
                {{ 
                  (project.team ? project.team.length : 0) + 
                  (project.developers ? project.developers.length : 0) + 
                  (project.assignedTo ? 1 : 0) + 
                  (project.responsiblePerson && project.responsiblePerson !== project.assignedTo ? 1 : 0)
                }}
              </div>
              <div class="mt-2 text-xs text-neutral-500">Combined project staff</div>
            </div>
            
            <div class="bg-neutral-50 rounded-lg p-4">
              <div class="text-sm text-neutral-500 mb-1">Core Team</div>
              <div class="text-2xl font-bold text-neutral-800">
                {{ (project.team ? project.team.length : 0) }}
              </div>
              <div class="mt-2 text-xs text-neutral-500">General team members</div>
            </div>
            
            <div class="bg-neutral-50 rounded-lg p-4">
              <div class="text-sm text-neutral-500 mb-1">Technical Team</div>
              <div class="text-2xl font-bold text-neutral-800">
                {{ (project.developers ? project.developers.length : 0) }}
              </div>
              <div class="mt-2 text-xs text-neutral-500">Assigned developers</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- External Links Tab Content -->
      <div v-if="activeTab === 'links'" class="bg-white rounded-lg shadow-card p-6">
        <h2 class="text-lg font-medium text-neutral-900 mb-6 flex items-center">
          <span class="mdi mdi-link-variant text-xl text-purple-600 mr-2"></span>
          External Project Links
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <!-- GitHub Repository -->
          <div v-if="project.externalLinks.githubRepo" class="bg-white rounded-xl shadow-md border border-neutral-100 p-5 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div class="h-16 w-16 rounded-xl bg-neutral-800 flex items-center justify-center mb-4">
              <span class="mdi mdi-github text-3xl text-white"></span>
            </div>
            <h3 class="text-lg font-medium text-neutral-800 mb-1">GitHub Repository</h3>
            <p class="text-sm text-neutral-600 mb-4">Access the project's source code repository</p>
            <div class="text-sm text-neutral-500 bg-neutral-50 p-3 rounded-md mb-4 break-all">
              {{ project.externalLinks.githubRepo }}
            </div>
            <a 
              :href="isValidUrl(project.externalLinks.githubRepo) ? project.externalLinks.githubRepo : '#'" 
              target="_blank" 
              rel="noopener noreferrer"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-neutral-800 hover:bg-neutral-700 focus:outline-none"
              :class="{ 'opacity-50 cursor-not-allowed': !isValidUrl(project.externalLinks.githubRepo) }"
              :tabindex="isValidUrl(project.externalLinks.githubRepo) ? 0 : -1"
            >
              <span class="mdi mdi-open-in-new mr-2"></span>
              View Repository
            </a>
          </div>
          
          <!-- Figma Design -->
          <div v-if="project.externalLinks.figmaLink" class="bg-white rounded-xl shadow-md border border-neutral-100 p-5 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div class="h-16 w-16 rounded-xl bg-pink-100 flex items-center justify-center mb-4">
              <span class="mdi mdi-figma text-3xl text-pink-600"></span>
            </div>
            <h3 class="text-lg font-medium text-neutral-800 mb-1">Figma Design</h3>
            <p class="text-sm text-neutral-600 mb-4">Access the project's design files in Figma</p>
            <div class="text-sm text-neutral-500 bg-neutral-50 p-3 rounded-md mb-4 break-all">
              {{ project.externalLinks.figmaLink }}
            </div>
            <a 
              :href="isValidUrl(project.externalLinks.figmaLink) ? project.externalLinks.figmaLink : '#'" 
              target="_blank" 
              rel="noopener noreferrer"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none"
              :class="{ 'opacity-50 cursor-not-allowed': !isValidUrl(project.externalLinks.figmaLink) }"
              :tabindex="isValidUrl(project.externalLinks.figmaLink) ? 0 : -1"
            >
              <span class="mdi mdi-open-in-new mr-2"></span>
              View Design
            </a>
          </div>
          
          <!-- Jira Project -->
          <div v-if="project.externalLinks.jiraProject" class="bg-white rounded-xl shadow-md border border-neutral-100 p-5 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div class="h-16 w-16 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <span class="mdi mdi-jira text-3xl text-blue-600"></span>
            </div>
            <h3 class="text-lg font-medium text-neutral-800 mb-1">Jira Project</h3>
            <p class="text-sm text-neutral-600 mb-4">Access the project's tasks and tracking in Jira</p>
            <div class="text-sm text-neutral-500 bg-neutral-50 p-3 rounded-md mb-4 break-all">
              {{ project.externalLinks.jiraProject }}
            </div>
            <a 
              :href="isValidUrl(project.externalLinks.jiraProject) ? project.externalLinks.jiraProject : '#'" 
              target="_blank" 
              rel="noopener noreferrer"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              :class="{ 'opacity-50 cursor-not-allowed': !isValidUrl(project.externalLinks.jiraProject) }"
              :tabindex="isValidUrl(project.externalLinks.jiraProject) ? 0 : -1"
            >
              <span class="mdi mdi-open-in-new mr-2"></span>
              View Jira Board
            </a>
          </div>
          
          <!-- No external links placeholder -->
          <div v-if="!project.externalLinks.githubRepo && !project.externalLinks.figmaLink && !project.externalLinks.jiraProject" 
               class="col-span-full bg-neutral-50 rounded-lg p-8 text-center border border-dashed border-neutral-300">
            <div class="h-16 w-16 rounded-full bg-neutral-200 mx-auto flex items-center justify-center mb-3">
              <span class="mdi mdi-link-variant-off text-2xl text-neutral-400"></span>
            </div>
            <h4 class="text-neutral-600 font-medium mb-2">No External Links Added</h4>
            <p class="text-neutral-500 text-sm max-w-md mx-auto">
              External links to GitHub, Figma, or Jira help team members access important project resources.
              {{ canEdit ? 'Click "Edit Project" to add external links to this project.' : '' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Add styles for the enhanced form UI */
.form-tab-enter-active,
.form-tab-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.form-tab-enter-from,
.form-tab-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Styles for range input */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  height: 7px;
  background: #e5e7eb;
  border-radius: 5px;
  background-image: linear-gradient(#4f46e5, #4f46e5);
  background-repeat: no-repeat;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: #4f46e5;
  cursor: pointer;
  box-shadow: 0 0 2px 0 #555;
}

input[type="range"]::-webkit-slider-runnable-track {
  -webkit-appearance: none;
  box-shadow: none;
  border: none;
  background: transparent;
}

/* Additional hover effects */
.form-card-hover {
  transition: all 0.3s ease;
}

.form-card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* External Links Card Styles */
.external-link-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.external-link-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* GitHub specific styling */
.github-link {
  border-left-color: #24292e;
}

/* Figma specific styling */
.figma-link {
  border-left-color: #f24e1e;
}

/* Jira specific styling */
.jira-link {
  border-left-color: #0052cc;
}
</style>