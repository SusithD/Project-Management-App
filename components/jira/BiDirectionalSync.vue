<template>
  <div class="bg-white rounded-lg shadow-md border border-neutral-200 p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-neutral-800 flex items-center">
          <span class="mdi mdi-sync text-blue-600 mr-2"></span>
          Bi-directional Sync
        </h3>
        <p class="text-sm text-neutral-600 mt-1">
          Keep your project and JIRA issues synchronized automatically
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <span :class="['px-2 py-1 rounded-full text-xs font-medium', 
          syncStatus.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800']">
          {{ syncStatus.enabled ? 'Enabled' : 'Disabled' }}
        </span>
      </div>
    </div>

    <!-- Sync Configuration -->
    <div class="space-y-6">
      <!-- Enable/Disable Sync -->
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 class="font-medium text-gray-900">Enable Bi-directional Sync</h4>
          <p class="text-sm text-gray-600">Automatically sync changes between project and JIRA</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="config.enabled"
            @change="updateSyncConfig"
            class="sr-only"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      <!-- Sync Fields Configuration -->
      <div v-if="config.enabled" class="space-y-4">
        <h4 class="font-medium text-gray-900">Sync Fields</h4>
        <div class="grid grid-cols-2 gap-4">
          <label v-for="(field, key) in config.syncFields" :key="key" class="flex items-center">
            <input
              type="checkbox"
              v-model="config.syncFields[key]"
              @change="updateSyncConfig"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span class="ml-2 text-sm text-gray-700 capitalize">{{ key.replace(/([A-Z])/g, ' $1') }}</span>
          </label>
        </div>
      </div>

      <!-- Conflict Resolution Strategy -->
      <div v-if="config.enabled" class="space-y-4">
        <h4 class="font-medium text-gray-900">Conflict Resolution</h4>
        <select
          v-model="config.conflictResolution"
          @change="updateSyncConfig"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="newest_wins">Newest Changes Win</option>
          <option value="jira_wins">JIRA Always Wins</option>
          <option value="project_wins">Project Always Wins</option>
          <option value="manual">Manual Resolution</option>
        </select>
        <p class="text-xs text-gray-500">
          How conflicts should be resolved when both project and JIRA are updated
        </p>
      </div>

      <!-- Manual Sync Actions -->
      <div class="border-t pt-4">
        <div class="flex items-center space-x-3">
          <button
            @click="triggerSync"
            :disabled="!config.enabled || syncing"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span v-if="syncing" class="mdi mdi-loading mdi-spin mr-2"></span>
            <span v-else class="mdi mdi-sync mr-2"></span>
            {{ syncing ? 'Syncing...' : 'Sync Now' }}
          </button>

          <button
            @click="detectConflicts"
            :disabled="!config.enabled || detecting"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span v-if="detecting" class="mdi mdi-loading mdi-spin mr-2"></span>
            <span v-else class="mdi mdi-alert-outline mr-2"></span>
            {{ detecting ? 'Checking...' : 'Check Conflicts' }}
          </button>
        </div>
      </div>

      <!-- Sync Status -->
      <div v-if="syncStatus.lastSync" class="bg-blue-50 p-4 rounded-lg">
        <div class="flex items-center">
          <span class="mdi mdi-information text-blue-600 mr-2"></span>
          <div>
            <p class="text-sm font-medium text-blue-900">Last Sync</p>
            <p class="text-sm text-blue-700">{{ formatDate(syncStatus.lastSync) }}</p>
            <p v-if="syncStatus.lastBidirectionalSync" class="text-xs text-blue-600">
              Last bi-directional sync: {{ formatDate(syncStatus.lastBidirectionalSync) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Conflicts Display -->
      <div v-if="conflicts.length > 0" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h5 class="font-medium text-yellow-900 mb-3 flex items-center">
          <span class="mdi mdi-alert text-yellow-600 mr-2"></span>
          Sync Conflicts Detected ({{ conflicts.length }})
        </h5>
        <div class="space-y-3">
          <div v-for="conflict in conflicts" :key="conflict.field" class="bg-white p-3 rounded border">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-sm text-gray-900 capitalize">
                {{ conflict.field.replace(/([A-Z])/g, ' $1') }}
              </span>
              <select
                v-if="config.conflictResolution === 'manual'"
                v-model="conflict.resolution"
                class="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="jira">Use JIRA Value</option>
                <option value="project">Use Project Value</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p class="font-medium text-gray-700">JIRA Value:</p>
                <p class="text-gray-600">{{ conflict.jiraValue }}</p>
              </div>
              <div>
                <p class="font-medium text-gray-700">Project Value:</p>
                <p class="text-gray-600">{{ conflict.projectValue }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 flex space-x-2">
          <button
            @click="resolveConflicts"
            :disabled="resolving"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
          >
            <span v-if="resolving" class="mdi mdi-loading mdi-spin mr-2"></span>
            {{ resolving ? 'Resolving...' : 'Resolve Conflicts' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});

// Emits
const emit = defineEmits(['updated']);

// Stores
const notificationsStore = useNotificationsStore();

// Reactive data
const syncing = ref(false);
const detecting = ref(false);
const resolving = ref(false);
const conflicts = ref([]);

const config = ref({
  enabled: false,
  conflictResolution: 'newest_wins',
  syncFields: {
    summary: true,
    description: true,
    status: true,
    priority: true,
    assignee: false,
    dueDate: true,
    progress: true
  }
});

// Computed
const syncStatus = computed(() => {
  const integration = props.project.jiraIntegration;
  return {
    enabled: integration?.bidirectionalSync?.enabled || config.value.enabled,
    lastSync: integration?.lastSyncDate,
    lastBidirectionalSync: integration?.lastBidirectionalSync
  };
});

// Methods
const updateSyncConfig = async () => {
  try {
    const response = await fetch('/api/jira/update-sync-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: props.project._id || props.project.id,
        syncConfig: config.value
      })
    });

    if (response.ok) {
      notificationsStore.success('Sync configuration updated');
      emit('updated');
    } else {
      throw new Error('Failed to update sync configuration');
    }
  } catch (error) {
    console.error('Error updating sync config:', error);
    notificationsStore.error('Failed to update sync configuration');
  }
};

const triggerSync = async () => {
  if (!props.project.jiraIntegration?.projectKey) return;
  
  syncing.value = true;
  try {
    const response = await fetch('/api/jira/bidirectional-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: props.project._id || props.project.id,
        jiraIssueKey: `${props.project.jiraIntegration.projectKey}-1`, // Main project issue
        syncConfig: config.value,
        resolveConflicts: config.value.conflictResolution !== 'manual'
      })
    });

    const data = await response.json();
    
    if (data.body?.success) {
      if (data.body.conflicts?.length > 0) {
        conflicts.value = data.body.conflicts;
        notificationsStore.warning(`Sync completed with ${data.body.conflicts.length} conflicts`);
      } else {
        notificationsStore.success('Bi-directional sync completed successfully');
      }
      emit('updated');
    } else {
      throw new Error(data.body?.message || 'Sync failed');
    }
  } catch (error) {
    console.error('Error during sync:', error);
    notificationsStore.error('Failed to perform bi-directional sync');
  } finally {
    syncing.value = false;
  }
};

const detectConflicts = async () => {
  if (!props.project.jiraIntegration?.projectKey) return;
  
  detecting.value = true;
  try {
    const response = await fetch('/api/jira/bidirectional-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: props.project._id || props.project.id,
        jiraIssueKey: `${props.project.jiraIntegration.projectKey}-1`,
        syncConfig: config.value,
        resolveConflicts: false
      })
    });

    const data = await response.json();
    
    if (data.body?.success) {
      conflicts.value = data.body.conflicts || [];
      if (conflicts.value.length === 0) {
        notificationsStore.success('No conflicts detected');
      } else {
        notificationsStore.info(`Found ${conflicts.value.length} conflicts`);
      }
    } else {
      throw new Error(data.body?.message || 'Failed to check conflicts');
    }
  } catch (error) {
    console.error('Error checking conflicts:', error);
    notificationsStore.error('Failed to check for conflicts');
  } finally {
    detecting.value = false;
  }
};

const resolveConflicts = async () => {
  resolving.value = true;
  try {
    const response = await fetch('/api/jira/bidirectional-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectId: props.project._id || props.project.id,
        jiraIssueKey: `${props.project.jiraIntegration.projectKey}-1`,
        syncConfig: config.value,
        resolveConflicts: true,
        manualResolutions: conflicts.value.reduce((acc, conflict) => {
          if (conflict.resolution) {
            acc[conflict.field] = conflict.resolution;
          }
          return acc;
        }, {})
      })
    });

    const data = await response.json();
    
    if (data.body?.success) {
      conflicts.value = [];
      notificationsStore.success('Conflicts resolved successfully');
      emit('updated');
    } else {
      throw new Error(data.body?.message || 'Failed to resolve conflicts');
    }
  } catch (error) {
    console.error('Error resolving conflicts:', error);
    notificationsStore.error('Failed to resolve conflicts');
  } finally {
    resolving.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
};

// Initialize configuration from project data
onMounted(() => {
  const integration = props.project.jiraIntegration;
  if (integration?.bidirectionalSync) {
    config.value = {
      ...config.value,
      ...integration.bidirectionalSync
    };
  }
});
</script>