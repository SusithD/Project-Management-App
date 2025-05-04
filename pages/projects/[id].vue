<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '~/stores/auth';

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
  } catch (err) {
    console.error('Error adding update:', err);
    alert('Failed to add update. Please try again.');
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
    
    alert('File uploaded successfully!');
  } catch (err) {
    console.error('Error uploading file:', err);
    alert('Failed to upload file. Please try again.');
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
  } catch (err) {
    console.error('Error downloading file:', err);
    alert(`Error downloading ${file.name}. Please try again.`);
  }
};

// Delete a file
const deleteFile = async (file, index) => {
  if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
  
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
    alert('File deleted successfully');
  } catch (err) {
    console.error('Error deleting file:', err);
    alert(`Failed to delete ${file.name}. Please try again.`);
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
    alert('Project updated successfully');
  } catch (err) {
    console.error('Error updating project:', err);
    alert('Failed to update project. Please try again.');
  }
};

// Mark project as completed
const markProjectCompleted = async () => {
  if (!confirm('Are you sure you want to mark this project as completed?')) return;
  
  try {
    // Set status to completed
    editedProject.value = { 
      ...project.value, 
      status: 'Completed',
      progress: 100
    };
    
    await saveProject();
  } catch (err) {
    console.error('Error marking project as completed:', err);
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
onMounted(() => {
  fetchProject();
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
        <h2 class="text-lg font-medium text-neutral-900 mb-4">Edit Project Details</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Project Name -->
          <div>
            <label for="project-name" class="block text-sm font-medium text-neutral-700 mb-1">Project Name</label>
            <input 
              id="project-name"
              v-model="editedProject.name"
              type="text"
              class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          
          <!-- Status -->
          <div>
            <label for="project-status" class="block text-sm font-medium text-neutral-700 mb-1">Status</label>
            <select 
              id="project-status"
              v-model="editedProject.status"
              class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option v-for="status in projectStatuses" :key="status" :value="status">{{ status }}</option>
            </select>
          </div>
          
          <!-- Start Date -->
          <div>
            <label for="project-start-date" class="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
            <input 
              id="project-start-date"
              v-model="editedProject.startDate"
              type="date"
              class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          
          <!-- End Date -->
          <div>
            <label for="project-end-date" class="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
            <input 
              id="project-end-date"
              v-model="editedProject.endDate"
              type="date"
              class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          
          <!-- Progress -->
          <div>
            <label for="project-progress" class="block text-sm font-medium text-neutral-700 mb-1">Progress (%)</label>
            <div class="flex items-center">
              <input 
                id="project-progress"
                v-model.number="editedProject.progress"
                type="number"
                min="0"
                max="100"
                class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <div class="ml-2">{{ editedProject.progress }}%</div>
            </div>
          </div>
          
          <!-- Assigned To -->
          <div>
            <label for="project-assigned" class="block text-sm font-medium text-neutral-700 mb-1">Assigned To</label>
            <input 
              id="project-assigned"
              v-model="editedProject.assignedTo"
              type="text"
              class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          
          <!-- Remarks - Full width -->
          <div class="col-span-1 md:col-span-2">
            <label for="project-remarks" class="block text-sm font-medium text-neutral-700 mb-1">Remarks</label>
            <textarea 
              id="project-remarks"
              v-model="editedProject.remarks"
              rows="3"
              class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            ></textarea>
          </div>
          
          <!-- Notes - Full width -->
          <div class="col-span-1 md:col-span-2">
            <label for="project-notes" class="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
            <textarea 
              id="project-notes"
              v-model="editedProject.notes"
              rows="3"
              class="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            ></textarea>
          </div>
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
          <div v-if="project.team && project.team.length" class="text-sm text-neutral-600">
            <div class="font-medium mb-1">Team Members:</div>
            <div v-for="(member, index) in project.team" :key="index" class="flex items-center mb-1">
              <span class="mdi mdi-account text-lg mr-2 text-neutral-500"></span>
              {{ member }}
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
          <p class="text-neutral-700 bg-neutral-50 p-3 rounded-md">{{ project.remarks || 'No remarks provided' }}</p>
        </div>
        
        <div class="mb-6">
          <h3 class="text-md font-medium text-neutral-800 mb-2">Notes</h3>
          <p class="text-neutral-700 bg-neutral-50 p-3 rounded-md">{{ project.notes || 'No notes provided' }}</p>
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
                <span class="font-medium text-neutral-900">{{ project.team?.length || 0 }} members</span>
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
    </div>
  </div>
</template>