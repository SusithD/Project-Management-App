<template>
  <div class="bg-white rounded-xl shadow-md border border-neutral-100 p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <div class="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
          <span class="mdi mdi-jira text-xl text-blue-600"></span>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-neutral-800">JIRA Issues</h3>
          <p class="text-sm text-neutral-600">Manage and track JIRA issues for {{ projectKey }}</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-3">
        <!-- Status Filter -->
        <select 
          v-model="selectedStatus"
          @change="loadIssues"
          class="px-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
          <option value="Blocked">Blocked</option>
        </select>
        
        <!-- Refresh Button -->
        <button
          @click="loadIssues"
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="loading" class="mdi mdi-loading mdi-spin text-base mr-1"></span>
          <span v-else class="mdi mdi-refresh text-base mr-1"></span>
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
        
        <!-- Create Issue Button -->
        <button
          @click="showCreateIssueModal = true"
          class="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-success-600 text-white hover:bg-success-700 transition-colors"
        >
          <span class="mdi mdi-plus text-base mr-1"></span>
          Create Issue
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && issues.length === 0" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-error-50 border border-error-200 text-error-800 rounded-md p-4">
      <div class="flex items-center">
        <span class="mdi mdi-alert-circle text-lg mr-2"></span>
        <div>
          <div class="font-medium">Error Loading Issues</div>
          <div class="text-sm mt-1">{{ error }}</div>
        </div>
      </div>
    </div>

    <!-- Issues List -->
    <div v-else-if="issues.length > 0" class="space-y-4">
      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-blue-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-blue-900">{{ stats.total }}</div>
          <div class="text-sm text-blue-700">Total Issues</div>
        </div>
        <div class="bg-yellow-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-yellow-900">{{ stats.todo }}</div>
          <div class="text-sm text-yellow-700">To Do</div>
        </div>
        <div class="bg-orange-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-orange-900">{{ stats.inProgress }}</div>
          <div class="text-sm text-orange-700">In Progress</div>
        </div>
        <div class="bg-success-50 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-success-900">{{ stats.done }}</div>
          <div class="text-sm text-success-700">Done</div>
        </div>
      </div>

      <!-- Issues Grid -->
      <div class="grid gap-4">
        <div
          v-for="issue in filteredIssues"
          :key="issue.key"
          class="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <!-- Issue Header -->
              <div class="flex items-center mb-2">
                <span class="font-mono text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded mr-3">
                  {{ issue.key }}
                </span>
                <span :class="getStatusBadgeClass(issue.status.name)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ issue.status.name }}
                </span>
                <span :class="getPriorityBadgeClass(issue.priority)" class="ml-2 px-2 py-1 rounded-full text-xs font-medium">
                  {{ issue.priority }}
                </span>
              </div>
              
              <!-- Issue Title -->
              <h4 class="font-medium text-neutral-900 mb-2">{{ issue.summary }}</h4>
              
              <!-- Issue Description -->
              <p v-if="issue.description" class="text-sm text-neutral-600 mb-3 line-clamp-2">
                {{ stripHtml(issue.description) }}
              </p>
              
              <!-- Issue Meta -->
              <div class="flex items-center text-xs text-neutral-500 space-x-4">
                <div v-if="issue.assignee" class="flex items-center">
                  <span class="mdi mdi-account text-base mr-1"></span>
                  {{ issue.assignee.displayName }}
                </div>
                <div class="flex items-center">
                  <span class="mdi mdi-clock-outline text-base mr-1"></span>
                  Created {{ formatDate(issue.created) }}
                </div>
                <div v-if="issue.duedate" class="flex items-center">
                  <span class="mdi mdi-calendar-clock text-base mr-1"></span>
                  Due {{ formatDate(issue.duedate) }}
                </div>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center space-x-2 ml-4">
              <button
                @click="viewIssueInJira(issue.key)"
                class="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="View in JIRA"
              >
                <span class="mdi mdi-open-in-new text-base"></span>
              </button>
              <button
                @click="syncIssueToTask(issue)"
                class="p-2 text-neutral-600 hover:text-success-600 hover:bg-success-50 rounded-md transition-colors"
                title="Sync to Task"
              >
                <span class="mdi mdi-sync text-base"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore" class="flex justify-center pt-4">
        <button
          @click="loadMoreIssues"
          :disabled="loadingMore"
          class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="loadingMore" class="mdi mdi-loading mdi-spin text-base mr-2"></span>
          <span v-else class="mdi mdi-chevron-down text-base mr-2"></span>
          {{ loadingMore ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <span class="mdi mdi-ticket-outline text-6xl text-neutral-300 block mb-4"></span>
      <h3 class="text-lg font-medium text-neutral-900 mb-2">No Issues Found</h3>
      <p class="text-neutral-600 mb-4">
        {{ selectedStatus ? `No issues with status "${selectedStatus}"` : 'No JIRA issues found for this project' }}
      </p>
      <button
        @click="showCreateIssueModal = true"
        class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        <span class="mdi mdi-plus text-base mr-2"></span>
        Create First Issue
      </button>
    </div>

    <!-- Create Issue Modal -->
    <CreateIssueModal
      v-if="showCreateIssueModal"
      :project-key="projectKey"
      @issue-created="onIssueCreated"
      @close="showCreateIssueModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotificationsStore } from '~/stores/notifications'
import { useAuthStore } from '~/stores/auth'

const props = defineProps({
  projectKey: {
    type: String,
    required: true
  }
})

const notificationsStore = useNotificationsStore()
const authStore = useAuthStore()

// Reactive state
const issues = ref([])
const selectedStatus = ref('')
const loading = ref(false)
const loadingMore = ref(false)
const error = ref(null)
const hasMore = ref(false)
const maxResults = ref(50)
const showCreateIssueModal = ref(false)

// Computed properties
const filteredIssues = computed(() => {
  if (!selectedStatus.value) return issues.value
  return issues.value.filter(issue => issue.status.name === selectedStatus.value)
})

const stats = computed(() => {
  const total = issues.value.length
  const todo = issues.value.filter(i => ['To Do', 'Open', 'New'].includes(i.status.name)).length
  const inProgress = issues.value.filter(i => ['In Progress', 'In Review'].includes(i.status.name)).length
  const done = issues.value.filter(i => ['Done', 'Closed', 'Resolved'].includes(i.status.name)).length
  
  return { total, todo, inProgress, done }
})

// Load issues from JIRA API
const loadIssues = async (append = false) => {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
    issues.value = []
  }
  
  error.value = null

  try {
    const startAt = append ? issues.value.length : 0
    const response = await fetch(`/api/jira/issues?projectKey=${props.projectKey}&maxResults=${maxResults.value}&startAt=${startAt}`, {
      headers: {
        'Authorization': authStore.authHeader
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to load issues: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (append) {
      issues.value.push(...data.body.issues)
    } else {
      issues.value = data.body.issues
    }
    
    hasMore.value = data.body.issues.length === maxResults.value
  } catch (err) {
    console.error('Error loading JIRA issues:', err)
    error.value = err.message
    notificationsStore.error('Failed to load JIRA issues')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// Load more issues
const loadMoreIssues = () => {
  loadIssues(true)
}

// Get status badge styling
const getStatusBadgeClass = (status) => {
  const statusLower = status.toLowerCase()
  if (['done', 'closed', 'resolved'].includes(statusLower)) {
    return 'bg-success-100 text-success-800'
  } else if (['in progress', 'in review'].includes(statusLower)) {
    return 'bg-orange-100 text-orange-800'
  } else if (['to do', 'open', 'new'].includes(statusLower)) {
    return 'bg-blue-100 text-blue-800'
  } else {
    return 'bg-neutral-100 text-neutral-800'
  }
}

// Get priority badge styling
const getPriorityBadgeClass = (priority) => {
  const priorityLower = priority.toLowerCase()
  if (['highest', 'critical'].includes(priorityLower)) {
    return 'bg-error-100 text-error-800'
  } else if (['high'].includes(priorityLower)) {
    return 'bg-warning-100 text-warning-800'
  } else if (['medium'].includes(priorityLower)) {
    return 'bg-yellow-100 text-yellow-800'
  } else {
    return 'bg-neutral-100 text-neutral-800'
  }
}

// Strip HTML from description
const stripHtml = (html) => {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

// View issue in JIRA
const viewIssueInJira = (issueKey) => {
  // Get the Jira base URL from runtime configuration
  const config = useRuntimeConfig();
  const jiraBaseUrl = config.jira?.baseUrl || config.public.jira?.baseUrl;
  
  if (!jiraBaseUrl) {
    notificationsStore.error('Jira base URL is not configured');
    return;
  }
  
  window.open(`${jiraBaseUrl}/browse/${issueKey}`, '_blank')
}

// Sync issue to task
const syncIssueToTask = async (issue) => {
  try {
    const response = await fetch('/api/jira/sync-issue-to-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authStore.authHeader
      },
      body: JSON.stringify({
        issueKey: issue.key,
        projectId: props.projectId
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to sync issue: ${response.statusText}`)
    }

    notificationsStore.success(`Issue ${issue.key} synced to tasks successfully`)
  } catch (err) {
    console.error('Error syncing issue to task:', err)
    notificationsStore.error('Failed to sync issue to task')
  }
}

// Handle issue creation
const onIssueCreated = (newIssue) => {
  issues.value.unshift(newIssue)
  showCreateIssueModal.value = false
  notificationsStore.success('Issue created successfully')
}

// Initialize component
onMounted(() => {
  loadIssues()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>