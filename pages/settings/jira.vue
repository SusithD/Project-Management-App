<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-neutral-900 mb-2">JIRA Integration Test</h1>
      <p class="text-neutral-600">Test and configure your JIRA integration settings.</p>
    </div>

    <!-- Connection Test Section -->
    <div class="bg-white rounded-lg shadow-md border border-neutral-200 p-6 mb-6">
      <h2 class="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
        <span class="mdi mdi-connection text-blue-600 mr-2"></span>
        Connection Test
      </h2>
      
      <div class="flex items-center gap-4 mb-4">
        <button 
          @click="testConnection"
          :disabled="testing"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors flex items-center"
        >
          <span class="mdi mdi-connection mr-2"></span>
          {{ testing ? 'Testing...' : 'Test Connection' }}
        </button>
        
        <div v-if="connectionResult" class="flex items-center">
          <span 
            :class="[
              'mdi text-lg mr-2',
              connectionResult.success ? 'mdi-check-circle text-green-600' : 'mdi-alert-circle text-red-600'
            ]"
          ></span>
          <span :class="connectionResult.success ? 'text-green-700' : 'text-red-700'">
            {{ connectionResult.message }}
          </span>
        </div>
      </div>

      <!-- Configuration Display -->
      <div v-if="connectionResult?.config" class="bg-neutral-50 rounded-md p-4">
        <h3 class="text-sm font-medium text-neutral-700 mb-2">Current Configuration:</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium">Base URL:</span>
            <span class="ml-2 text-neutral-600">{{ connectionResult.config.baseUrl }}</span>
          </div>
          <div>
            <span class="font-medium">Email:</span>
            <span class="ml-2 text-neutral-600">{{ connectionResult.config.email }}</span>
          </div>
          <div>
            <span class="font-medium">Project Key:</span>
            <span class="ml-2 text-neutral-600">{{ connectionResult.config.projectKey }}</span>
          </div>
          <div>
            <span class="font-medium">Enabled:</span>
            <span :class="['ml-2', connectionResult.config.enabled ? 'text-green-600' : 'text-red-600']">
              {{ connectionResult.config.enabled ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- JIRA Projects Section -->
    <div class="bg-white rounded-lg shadow-md border border-neutral-200 p-6 mb-6">
      <h2 class="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
        <span class="mdi mdi-folder-multiple text-purple-600 mr-2"></span>
        JIRA Projects
      </h2>
      
      <div class="flex items-center gap-4 mb-4">
        <button 
          @click="fetchProjects"
          :disabled="fetchingProjects"
          class="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md transition-colors flex items-center"
        >
          <span class="mdi mdi-folder-multiple mr-2"></span>
          {{ fetchingProjects ? 'Loading...' : 'Fetch Projects' }}
        </button>
      </div>

      <!-- Projects List -->
      <div v-if="projects.length > 0" class="space-y-2">
        <div v-for="project in projects" :key="project.id" 
             class="border border-neutral-200 rounded-md p-3 hover:bg-neutral-50 transition-colors">
          <div class="flex items-center justify-between">
            <div>
              <span class="font-medium text-neutral-800">{{ project.name }}</span>
              <span class="ml-2 text-sm text-neutral-500">({{ project.key }})</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs px-2 py-1 bg-neutral-100 rounded">{{ project.projectTypeKey }}</span>
              <button 
                @click="fetchProjectIssues(project.key)"
                class="text-blue-600 hover:text-blue-800 text-sm"
              >
                View Issues
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="projects.length === 0 && !fetchingProjects" class="text-neutral-500 text-center py-4">
        No projects loaded. Click "Fetch Projects" to load JIRA projects.
      </div>
    </div>

    <!-- JIRA Issues Section -->
    <div v-if="selectedProjectKey" class="bg-white rounded-lg shadow-md border border-neutral-200 p-6">
      <h2 class="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
        <span class="mdi mdi-ticket text-orange-600 mr-2"></span>
        Issues for {{ selectedProjectKey }}
      </h2>
      
      <div v-if="fetchingIssues" class="text-center py-4">
        <span class="mdi mdi-loading mdi-spin text-2xl text-blue-600"></span>
        <p class="text-neutral-600 mt-2">Loading issues...</p>
      </div>

      <div v-else-if="issues.length > 0" class="space-y-3">
        <div v-for="issue in issues" :key="issue.id" 
             class="border border-neutral-200 rounded-md p-4 hover:bg-neutral-50 transition-colors">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-medium text-neutral-800">{{ issue.key }}</span>
                <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{{ issue.issueType }}</span>
                <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">{{ issue.status.name }}</span>
                <span class="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">{{ issue.priority }}</span>
              </div>
              <h3 class="text-sm font-medium text-neutral-900 mb-1">{{ issue.summary }}</h3>
              <p v-if="issue.description" class="text-sm text-neutral-600 mb-2">{{ issue.description }}</p>
              <div class="flex items-center text-xs text-neutral-500 gap-4">
                <span v-if="issue.assignee">
                  <span class="mdi mdi-account mr-1"></span>
                  {{ issue.assignee.displayName }}
                </span>
                <span>
                  <span class="mdi mdi-calendar mr-1"></span>
                  {{ new Date(issue.created).toLocaleDateString() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="text-neutral-500 text-center py-4">
        No issues found for this project.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useNotificationsStore } from '~/stores/notifications';

definePageMeta({
  layout: 'dashboard'
});

const notificationsStore = useNotificationsStore();

// Reactive data
const testing = ref(false);
const connectionResult = ref(null);
const fetchingProjects = ref(false);
const projects = ref([]);
const fetchingIssues = ref(false);
const issues = ref([]);
const selectedProjectKey = ref('');

// Test JIRA connection
const testConnection = async () => {
  testing.value = true;
  connectionResult.value = null;
  
  try {
    const response = await fetch('/api/jira/test');
    const data = await response.json();
    
    connectionResult.value = data.body || data;
    
    if (connectionResult.value.success) {
      notificationsStore.success('JIRA connection successful!');
    } else {
      notificationsStore.error(connectionResult.value.message);
    }
  } catch (error) {
    console.error('Error testing JIRA connection:', error);
    connectionResult.value = {
      success: false,
      message: 'Failed to test connection. Please check your configuration.'
    };
    notificationsStore.error('Failed to test JIRA connection');
  } finally {
    testing.value = false;
  }
};

// Fetch JIRA projects
const fetchProjects = async () => {
  fetchingProjects.value = true;
  
  try {
    // Add user email for demo mode detection
    const authStore = useAuthStore();
    const queryParams = new URLSearchParams();
    if (authStore.userEmail) {
      queryParams.append('userEmail', authStore.userEmail);
    }
    
    const queryString = queryParams.toString();
    const url = `/api/jira/projects${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.body?.success || data.success) {
      projects.value = data.body?.projects || data.projects || [];
      notificationsStore.success(`Found ${projects.value.length} JIRA projects`);
    } else {
      notificationsStore.error(data.body?.message || data.message || 'Failed to fetch projects');
    }
  } catch (error) {
    console.error('Error fetching JIRA projects:', error);
    notificationsStore.error('Failed to fetch JIRA projects');
  } finally {
    fetchingProjects.value = false;
  }
};

// Fetch issues for a specific project
const fetchProjectIssues = async (projectKey) => {
  fetchingIssues.value = true;
  selectedProjectKey.value = projectKey;
  issues.value = [];
  
  try {
    // Add user email for demo mode detection
    const authStore = useAuthStore();
    const queryParams = new URLSearchParams();
    queryParams.append('projectKey', projectKey);
    queryParams.append('maxResults', '20');
    if (authStore.userEmail) {
      queryParams.append('userEmail', authStore.userEmail);
    }
    
    const queryString = queryParams.toString();
    const url = `/api/jira/issues?${queryString}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.body?.success || data.success) {
      issues.value = data.body?.issues || data.issues || [];
      notificationsStore.success(`Found ${issues.value.length} issues in ${projectKey}`);
    } else {
      notificationsStore.error(data.body?.message || data.message || 'Failed to fetch issues');
    }
  } catch (error) {
    console.error('Error fetching JIRA issues:', error);
    notificationsStore.error('Failed to fetch JIRA issues');
  } finally {
    fetchingIssues.value = false;
  }
};
</script>