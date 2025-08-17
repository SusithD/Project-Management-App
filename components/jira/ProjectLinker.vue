<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">JIRA Integration</h3>
            <p class="text-sm text-gray-600">Connect this project to JIRA for seamless issue tracking</p>
          </div>
        </div>
        <div v-if="jiraStatus.connected" class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Connected
          </span>
        </div>
      </div>
    </div>

    <div class="p-6">
      <!-- Connected State -->
      <div v-if="jiraStatus.connected" class="space-y-6">
        <!-- JIRA Project Info -->
        <div class="bg-blue-50 rounded-lg p-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="text-sm font-medium text-blue-900">Linked JIRA Project</h4>
              <p class="text-lg font-semibold text-blue-800 mt-1">{{ jiraStatus.projectKey }}</p>
              <p class="text-sm text-blue-700 mt-1">{{ jiraStatus.projectName || 'Loading project details...' }}</p>
            </div>
            <a
              v-if="jiraProjectUrl"
              :href="jiraProjectUrl"
              target="_blank"
              class="inline-flex items-center px-3 py-1.5 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              View in JIRA
            </a>
          </div>
        </div>

        <!-- Sync Stats -->
        <div v-if="jiraStatus.stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-gray-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-gray-900">{{ jiraStatus.stats.totalIssues }}</div>
            <div class="text-xs text-gray-600">Total Issues</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-600">{{ jiraStatus.stats.completedIssues }}</div>
            <div class="text-xs text-gray-600">Completed</div>
          </div>
          <div class="bg-yellow-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-yellow-600">{{ jiraStatus.stats.pendingIssues }}</div>
            <div class="text-xs text-gray-600">Pending</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-blue-600">{{ jiraStatus.stats.progressPercentage }}%</div>
            <div class="text-xs text-gray-600">Progress</div>
          </div>
        </div>

        <!-- Last Sync Info -->
        <div v-if="jiraStatus.lastSync" class="text-sm text-gray-600">
          Last synced: {{ formatDate(jiraStatus.lastSync) }}
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center space-x-3">
          <button
            @click="syncWithJira"
            :disabled="syncing"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="syncing" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {{ syncing ? 'Syncing...' : 'Sync Now' }}
          </button>

          <button
            @click="unlinkFromJira"
            :disabled="unlinking"
            class="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="unlinking" class="animate-spin -ml-1 mr-2 h-4 w-4 text-red-700" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
            </svg>
            {{ unlinking ? 'Unlinking...' : 'Unlink' }}
          </button>
        </div>
      </div>

      <!-- Not Connected State -->
      <div v-else class="space-y-6">
        <div class="text-center py-8">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">No JIRA Integration</h3>
          <p class="mt-1 text-sm text-gray-500">Connect this project to JIRA to sync issues and track progress</p>
        </div>

        <!-- JIRA Project Selection -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Select JIRA Project
            </label>
            <select
              v-model="selectedJiraProject"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              :disabled="loadingJiraProjects"
            >
              <option value="">{{ loadingJiraProjects ? 'Loading JIRA projects...' : 'Choose a JIRA project' }}</option>
              <option
                v-for="jiraProject in jiraProjects"
                :key="jiraProject.key"
                :value="jiraProject.key"
              >
                {{ jiraProject.key }} - {{ jiraProject.name }}
              </option>
            </select>
          </div>

          <div class="flex items-center">
            <input
              id="sync-enabled"
              v-model="syncEnabled"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="sync-enabled" class="ml-2 block text-sm text-gray-900">
              Enable automatic synchronization
            </label>
          </div>

          <button
            @click="linkToJira"
            :disabled="!selectedJiraProject || linking"
            class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="linking" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
            </svg>
            {{ linking ? 'Connecting...' : 'Connect to JIRA' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationsStore } from '~/stores/notifications';
import { useAuthStore } from '~/stores/auth';

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});

// Emits
const emit = defineEmits(['project-updated']);

// Stores
const notificationsStore = useNotificationsStore();
const authStore = useAuthStore();

// Reactive data
const jiraProjects = ref([]);
const selectedJiraProject = ref('');
const syncEnabled = ref(true);
const loadingJiraProjects = ref(false);
const linking = ref(false);
const unlinking = ref(false);
const syncing = ref(false);

// Computed properties
const jiraStatus = computed(() => {
  const project = props.project;

  if (project.jiraIntegration?.enabled) {
    return {
      connected: true,
      projectKey: project.jiraIntegration.projectKey,
      projectName: project.jiraIntegration.projectName,
      lastSync: project.jiraIntegration.lastSyncDate,
      stats: project.jiraIntegration.syncStats
    };
  }

  return {
    connected: false,
    projectKey: null,
    projectName: null,
    lastSync: null,
    stats: null
  };
});

const jiraProjectUrl = computed(() => {
  if (jiraStatus.value.connected && jiraStatus.value.projectKey) {
    // Get JIRA base URL from runtime config
    const config = useRuntimeConfig();
    const { $auth } = useNuxtApp();
    const isDemoUser = $auth?.currentUser?.email?.includes('@demo.com');

    // Use demo URL for demo users
    if (isDemoUser) {
      return `https://demo-company.atlassian.net/projects/${jiraStatus.value.projectKey}`;
    }

    return `${config.public.jira?.baseUrl || 'https://your-domain.atlassian.net'}/browse/${jiraStatus.value.projectKey}`;
  }
  return null;
});

// Methods
const loadJiraProjects = async () => {
  loadingJiraProjects.value = true;
  try {
    const authStore = useAuthStore();
    const userEmail = authStore.user?.mail || authStore.user?.email;
    console.log('[JIRA ProjectLinker] User email:', userEmail);
    console.log('[JIRA ProjectLinker] Is demo user:', authStore.isDemoUser());

    const url = userEmail ? `/api/jira/projects?userEmail=${encodeURIComponent(userEmail)}` : '/api/jira/projects';
    console.log('[JIRA ProjectLinker] Requesting URL:', url);

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      console.log('JIRA projects response:', data); // Debug log
      // Fix: The API returns data directly, not nested in body
      jiraProjects.value = data.projects || [];
      console.log('Loaded JIRA projects:', jiraProjects.value); // Debug log
    } else {
      throw new Error('Failed to load JIRA projects');
    }
  } catch (error) {
    console.error('Error loading JIRA projects:', error);
    notificationsStore.error('Failed to load JIRA projects. Please check your JIRA configuration.');
  } finally {
    loadingJiraProjects.value = false;
  }
};

const linkToJira = async () => {
  if (!selectedJiraProject.value) return;

  const authStore = useAuthStore();
  const userEmail = authStore.user?.mail || authStore.user?.email;

  linking.value = true;
  try {
    const response = await fetch('/api/jira/link-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: props.project._id || props.project.id,
        jiraProjectKey: selectedJiraProject.value,
        syncEnabled: syncEnabled.value,
        userEmail: userEmail
      })
    });

    const data = await response.json();

    if (response.ok && data.body?.success) {
      notificationsStore.success(data.body.message);
      emit('project-updated');
    } else {
      throw new Error(data.body?.message || 'Failed to link project to JIRA');
    }
  } catch (error) {
    console.error('Error linking project to JIRA:', error);
    notificationsStore.error(error.message || 'Failed to link project to JIRA');
  } finally {
    linking.value = false;
  }
};

const unlinkFromJira = async () => {
  const authStore = useAuthStore();
  const userEmail = authStore.user?.mail || authStore.user?.email;

  unlinking.value = true;
  try {
    const response = await fetch('/api/jira/unlink-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: props.project._id || props.project.id,
        userEmail: userEmail
      })
    });

    const data = await response.json();

    if (response.ok && data.body?.success) {
      notificationsStore.success(data.body.message);
      emit('project-updated');
    } else {
      throw new Error(data.body?.message || 'Failed to unlink project from JIRA');
    }
  } catch (error) {
    console.error('Error unlinking project from JIRA:', error);
    notificationsStore.error(error.message || 'Failed to unlink project from JIRA');
  } finally {
    unlinking.value = false;
  }
};

const syncWithJira = async () => {
  const authStore = useAuthStore();
  const userEmail = authStore.user?.mail || authStore.user?.email;

  syncing.value = true;
  try {
    const response = await fetch('/api/jira/sync-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectKey: jiraStatus.value.projectKey,
        projectId: props.project._id || props.project.id,
        userEmail: userEmail
      })
    });

    const data = await response.json();

    if (response.ok && data.body?.success) {
      notificationsStore.success(data.body.message);
      emit('project-updated');
    } else {
      throw new Error(data.body?.message || 'Failed to sync project with JIRA');
    }
  } catch (error) {
    console.error('Error syncing project with JIRA:', error);
    notificationsStore.error(error.message || 'Failed to sync project with JIRA');
  } finally {
    syncing.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
};

// Lifecycle
onMounted(async () => {
  if (!jiraStatus.value.connected) {
    await loadJiraProjects();
  }
});
</script>
