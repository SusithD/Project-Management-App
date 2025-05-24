<template>
  <div class="bg-white rounded-lg shadow-md border border-neutral-200 p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-neutral-800 flex items-center">
          <span class="mdi mdi-webhook text-purple-600 mr-2"></span>
          Webhook Integration
        </h3>
        <p class="text-sm text-neutral-600 mt-1">
          Real-time updates from JIRA through webhooks
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <span :class="['px-2 py-1 rounded-full text-xs font-medium', 
          webhookStatus.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800']">
          {{ webhookStatus.active ? 'Active' : 'Inactive' }}
        </span>
        <button
          @click="refreshWebhooks"
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <span :class="['mdi mdi-refresh mr-2', { 'mdi-spin': loading }]"></span>
          Refresh
        </button>
      </div>
    </div>

    <!-- Webhook Setup -->
    <div class="space-y-6">
      <!-- Create Webhook -->
      <div v-if="!hasActiveWebhook" class="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 class="font-medium text-blue-900 mb-3">Set Up Webhook</h4>
        <p class="text-sm text-blue-700 mb-4">
          Enable real-time synchronization by setting up a JIRA webhook
        </p>
        
        <form @submit.prevent="createWebhook" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Webhook Name
            </label>
            <input
              v-model="webhookForm.name"
              type="text"
              placeholder="Project Management App Webhook"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Events to Monitor
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label v-for="event in availableEvents" :key="event.key" class="flex items-center">
                <input
                  type="checkbox"
                  v-model="webhookForm.events"
                  :value="event.key"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700">{{ event.label }}</span>
              </label>
            </div>
          </div>
          
          <div class="flex space-x-3">
            <button
              type="submit"
              :disabled="creating || !webhookForm.name"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <span v-if="creating" class="mdi mdi-loading mdi-spin mr-2"></span>
              <span v-else class="mdi mdi-plus mr-2"></span>
              {{ creating ? 'Creating...' : 'Create Webhook' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Active Webhooks -->
      <div v-if="webhooks.length > 0" class="space-y-4">
        <h4 class="font-medium text-gray-900">Active Webhooks</h4>
        <div class="space-y-3">
          <div
            v-for="webhook in webhooks"
            :key="webhook.id"
            class="bg-gray-50 p-4 rounded-lg border"
          >
            <div class="flex items-center justify-between mb-3">
              <div>
                <h5 class="font-medium text-gray-900">{{ webhook.name }}</h5>
                <p class="text-sm text-gray-600">{{ webhook.url }}</p>
              </div>
              <div class="flex items-center space-x-2">
                <span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
                <button
                  @click="deleteWebhook(webhook.id)"
                  :disabled="deleting"
                  class="text-red-600 hover:text-red-800 p-1"
                  title="Delete webhook"
                >
                  <span class="mdi mdi-delete"></span>
                </button>
              </div>
            </div>
            
            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">Monitored Events:</p>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="event in webhook.events"
                  :key="event"
                  class="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                >
                  {{ formatEventName(event) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Webhook Activity -->
      <div v-if="webhookActivity.length > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <h4 class="font-medium text-gray-900">Recent Activity</h4>
          <button
            @click="clearActivity"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
        
        <div class="bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
          <div
            v-for="activity in webhookActivity"
            :key="activity.id"
            class="px-4 py-3 border-b border-gray-200 last:border-b-0"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span :class="getEventIcon(activity.event)" class="mr-2"></span>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ formatEventName(activity.event) }}
                  </p>
                  <p class="text-xs text-gray-600">
                    {{ activity.issueKey }} - {{ activity.summary }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500">
                  {{ formatDate(activity.timestamp) }}
                </p>
                <span :class="getStatusColor(activity.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ activity.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Webhook Configuration -->
      <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h5 class="font-medium text-yellow-900 mb-2 flex items-center">
          <span class="mdi mdi-information text-yellow-600 mr-2"></span>
          Webhook Configuration
        </h5>
        <div class="text-sm text-yellow-800 space-y-2">
          <p><strong>Endpoint URL:</strong> {{ webhookUrl }}</p>
          <p><strong>Security:</strong> Webhook events are validated using JIRA signatures</p>
          <p><strong>Retry Policy:</strong> Failed events are retried automatically</p>
        </div>
      </div>

      <!-- Webhook Testing -->
      <div class="border-t pt-4">
        <h4 class="font-medium text-gray-900 mb-3">Test Webhook</h4>
        <div class="flex space-x-3">
          <button
            @click="testWebhook"
            :disabled="testing || !hasActiveWebhook"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span v-if="testing" class="mdi mdi-loading mdi-spin mr-2"></span>
            <span v-else class="mdi mdi-test-tube mr-2"></span>
            {{ testing ? 'Testing...' : 'Send Test Event' }}
          </button>
          
          <button
            @click="validateWebhook"
            :disabled="validating || !hasActiveWebhook"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span v-if="validating" class="mdi mdi-loading mdi-spin mr-2"></span>
            <span v-else class="mdi mdi-check-network mr-2"></span>
            {{ validating ? 'Validating...' : 'Validate Connection' }}
          </button>
        </div>
      </div>

      <!-- Statistics -->
      <div v-if="webhookStats" class="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
        <div class="text-center">
          <p class="text-2xl font-bold text-gray-900">{{ webhookStats.totalEvents }}</p>
          <p class="text-sm text-gray-600">Total Events</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-600">{{ webhookStats.successfulEvents }}</p>
          <p class="text-sm text-gray-600">Successful</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-red-600">{{ webhookStats.failedEvents }}</p>
          <p class="text-sm text-gray-600">Failed</p>
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
const loading = ref(false);
const creating = ref(false);
const deleting = ref(false);
const testing = ref(false);
const validating = ref(false);
const webhooks = ref([]);
const webhookActivity = ref([]);

const webhookForm = ref({
  name: 'Project Management App Webhook',
  events: [
    'jira:issue_created',
    'jira:issue_updated',
    'jira:issue_deleted'
  ]
});

const availableEvents = [
  { key: 'jira:issue_created', label: 'Issue Created' },
  { key: 'jira:issue_updated', label: 'Issue Updated' },
  { key: 'jira:issue_deleted', label: 'Issue Deleted' },
  { key: 'comment_created', label: 'Comment Created' },
  { key: 'comment_updated', label: 'Comment Updated' },
  { key: 'comment_deleted', label: 'Comment Deleted' },
  { key: 'worklog_created', label: 'Worklog Created' },
  { key: 'worklog_updated', label: 'Worklog Updated' }
];

// Computed
const hasActiveWebhook = computed(() => webhooks.value.length > 0);

const webhookStatus = computed(() => ({
  active: hasActiveWebhook.value
}));

const webhookUrl = computed(() => {
  const config = useRuntimeConfig();
  return `${config.public.appUrl || 'http://localhost:3000'}/api/jira/webhook-handler`;
});

const webhookStats = computed(() => {
  if (webhookActivity.value.length === 0) return null;
  
  const total = webhookActivity.value.length;
  const successful = webhookActivity.value.filter(a => a.status === 'processed').length;
  const failed = total - successful;
  
  return {
    totalEvents: total,
    successfulEvents: successful,
    failedEvents: failed
  };
});

// Methods
const refreshWebhooks = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/jira/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'list' })
    });

    const data = await response.json();
    
    if (data.body?.success) {
      webhooks.value = data.body.webhooks || [];
    } else {
      throw new Error(data.body?.message || 'Failed to load webhooks');
    }
  } catch (error) {
    console.error('Error loading webhooks:', error);
    notificationsStore.error('Failed to load webhooks');
  } finally {
    loading.value = false;
  }
};

const createWebhook = async () => {
  creating.value = true;
  try {
    const response = await fetch('/api/jira/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        webhookConfig: webhookForm.value
      })
    });

    const data = await response.json();
    
    if (data.body?.success) {
      notificationsStore.success('Webhook created successfully');
      await refreshWebhooks();
      emit('updated');
    } else {
      throw new Error(data.body?.message || 'Failed to create webhook');
    }
  } catch (error) {
    console.error('Error creating webhook:', error);
    notificationsStore.error('Failed to create webhook');
  } finally {
    creating.value = false;
  }
};

const deleteWebhook = async (webhookId) => {
  if (!confirm('Are you sure you want to delete this webhook?')) return;
  
  deleting.value = true;
  try {
    const response = await fetch('/api/jira/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'delete',
        webhookId
      })
    });

    const data = await response.json();
    
    if (data.body?.success) {
      notificationsStore.success('Webhook deleted successfully');
      await refreshWebhooks();
      emit('updated');
    } else {
      throw new Error(data.body?.message || 'Failed to delete webhook');
    }
  } catch (error) {
    console.error('Error deleting webhook:', error);
    notificationsStore.error('Failed to delete webhook');
  } finally {
    deleting.value = false;
  }
};

const testWebhook = async () => {
  testing.value = true;
  try {
    // Simulate a test webhook event
    const testEvent = {
      webhookEvent: 'jira:issue_updated',
      timestamp: Date.now(),
      issue: {
        key: 'TEST-1',
        fields: {
          summary: 'Test webhook event',
          project: {
            key: props.project.jiraIntegration?.projectKey || 'TEST'
          }
        }
      },
      user: {
        displayName: 'Test User'
      }
    };
    
    const response = await fetch('/api/jira/webhook-handler', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEvent)
    });

    if (response.ok) {
      notificationsStore.success('Test webhook event sent successfully');
      addActivityEvent('jira:issue_updated', 'TEST-1', 'Test webhook event', 'processed');
    } else {
      throw new Error('Webhook test failed');
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
    notificationsStore.error('Webhook test failed');
    addActivityEvent('jira:issue_updated', 'TEST-1', 'Test webhook event', 'failed');
  } finally {
    testing.value = false;
  }
};

const validateWebhook = async () => {
  validating.value = true;
  try {
    // Check if webhook endpoint is reachable
    const response = await fetch(webhookUrl.value, {
      method: 'GET'
    });
    
    if (response.status === 404 || response.status === 405) {
      // Expected for POST-only endpoint
      notificationsStore.success('Webhook endpoint is reachable');
    } else {
      notificationsStore.warning('Webhook endpoint responded unexpectedly');
    }
  } catch (error) {
    console.error('Error validating webhook:', error);
    notificationsStore.error('Webhook endpoint validation failed');
  } finally {
    validating.value = false;
  }
};

const addActivityEvent = (event, issueKey, summary, status) => {
  webhookActivity.value.unshift({
    id: Date.now(),
    event,
    issueKey,
    summary,
    status,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 50 events
  if (webhookActivity.value.length > 50) {
    webhookActivity.value = webhookActivity.value.slice(0, 50);
  }
};

const clearActivity = () => {
  webhookActivity.value = [];
};

const formatEventName = (eventKey) => {
  const event = availableEvents.find(e => e.key === eventKey);
  return event ? event.label : eventKey.replace(/[_:]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getEventIcon = (event) => {
  const icons = {
    'jira:issue_created': 'mdi mdi-plus-circle text-green-600',
    'jira:issue_updated': 'mdi mdi-pencil text-blue-600',
    'jira:issue_deleted': 'mdi mdi-delete text-red-600',
    'comment_created': 'mdi mdi-comment-plus text-blue-600',
    'comment_updated': 'mdi mdi-comment-edit text-orange-600'
  };
  return icons[event] || 'mdi mdi-bell text-gray-600';
};

const getStatusColor = (status) => {
  const colors = {
    'processed': 'bg-green-100 text-green-800',
    'failed': 'bg-red-100 text-red-800',
    'pending': 'bg-yellow-100 text-yellow-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString();
};

// Load webhooks on mount
onMounted(() => {
  refreshWebhooks();
});

// Mock some activity for demonstration
onMounted(() => {
  // This would normally come from the database
  webhookActivity.value = [
    {
      id: 1,
      event: 'jira:issue_updated',
      issueKey: 'PROJ-123',
      summary: 'Update project status',
      status: 'processed',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 2,
      event: 'comment_created',
      issueKey: 'PROJ-124',
      summary: 'New comment added',
      status: 'processed',
      timestamp: new Date(Date.now() - 7200000).toISOString()
    }
  ];
});
</script>