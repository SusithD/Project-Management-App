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
        <!-- View Toggle -->
        <div class="flex bg-neutral-100 rounded-lg p-1">
          <button
            @click="currentView = 'list'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              currentView === 'list' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            ]"
          >
            <span class="mdi mdi-view-list mr-1"></span>List
          </button>
          <button
            @click="currentView = 'kanban'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              currentView === 'kanban' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            ]"
          >
            <span class="mdi mdi-view-column mr-1"></span>Kanban
          </button>
          <button
            @click="currentView = 'charts'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
              currentView === 'charts' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            ]"
          >
            <span class="mdi mdi-chart-pie mr-1"></span>Charts
          </button>
        </div>

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

    <!-- Enhanced Summary Stats with Charts -->
    <div v-else-if="issues.length > 0" class="space-y-6">
      <!-- Summary Cards with Visual Indicators -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 text-center border border-blue-200">
          <div class="text-2xl font-bold text-blue-900">{{ stats.total }}</div>
          <div class="text-sm text-blue-700">Total Issues</div>
          <div class="mt-2 h-2 bg-blue-200 rounded-full">
            <div class="h-2 bg-blue-600 rounded-full" style="width: 100%"></div>
          </div>
        </div>
        <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 text-center border border-yellow-200">
          <div class="text-2xl font-bold text-yellow-900">{{ stats.todo }}</div>
          <div class="text-sm text-yellow-700">To Do</div>
          <div class="mt-2 h-2 bg-yellow-200 rounded-full">
            <div class="h-2 bg-yellow-600 rounded-full" :style="{ width: `${(stats.todo / stats.total) * 100}%` }"></div>
          </div>
        </div>
        <div class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 text-center border border-orange-200">
          <div class="text-2xl font-bold text-orange-900">{{ stats.inProgress }}</div>
          <div class="text-sm text-orange-700">In Progress</div>
          <div class="mt-2 h-2 bg-orange-200 rounded-full">
            <div class="h-2 bg-orange-600 rounded-full" :style="{ width: `${(stats.inProgress / stats.total) * 100}%` }"></div>
          </div>
        </div>
        <div class="bg-gradient-to-r from-success-50 to-success-100 rounded-lg p-4 text-center border border-success-200">
          <div class="text-2xl font-bold text-success-900">{{ stats.done }}</div>
          <div class="text-sm text-success-700">Done</div>
          <div class="mt-2 h-2 bg-success-200 rounded-full">
            <div class="h-2 bg-success-600 rounded-full" :style="{ width: `${(stats.done / stats.total) * 100}%` }"></div>
          </div>
        </div>
      </div>

      <!-- View Content based on currentView -->
      <!-- List View -->
      <div v-if="currentView === 'list'" class="space-y-4">
        <!-- Issues Grid -->
        <div class="grid gap-4">
          <div
            v-for="issue in filteredIssues"
            :key="issue.key"
            class="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white transform hover:-translate-y-1"
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
                  <!-- Issue Type Badge -->
                  <span class="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {{ issue.issueType }}
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

      <!-- Kanban Board View -->
      <div v-else-if="currentView === 'kanban'" class="overflow-x-auto">
        <div class="flex space-x-6 min-w-max pb-4">
          <!-- To Do Column -->
          <div class="w-80 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-yellow-800 flex items-center">
                <span class="mdi mdi-clock-outline mr-2"></span>
                To Do
              </h3>
              <span class="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">
                {{ kanbanColumns.todo.length }}
              </span>
            </div>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="issue in kanbanColumns.todo"
                :key="issue.key"
                class="bg-white p-3 rounded-lg shadow-sm border border-yellow-200 hover:shadow-md transition-shadow cursor-pointer"
                @click="viewIssueInJira(issue.key)"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {{ issue.key }}
                  </span>
                  <span :class="getPriorityBadgeClass(issue.priority)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ issue.priority }}
                  </span>
                </div>
                <h4 class="font-medium text-neutral-900 text-sm mb-2">{{ issue.summary }}</h4>
                <div v-if="issue.assignee" class="flex items-center text-xs text-neutral-500">
                  <span class="mdi mdi-account mr-1"></span>
                  {{ issue.assignee.displayName }}
                </div>
              </div>
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="w-80 bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-orange-800 flex items-center">
                <span class="mdi mdi-progress-clock mr-2"></span>
                In Progress
              </h3>
              <span class="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full">
                {{ kanbanColumns.inProgress.length }}
              </span>
            </div>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="issue in kanbanColumns.inProgress"
                :key="issue.key"
                class="bg-white p-3 rounded-lg shadow-sm border border-orange-200 hover:shadow-md transition-shadow cursor-pointer"
                @click="viewIssueInJira(issue.key)"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {{ issue.key }}
                  </span>
                  <span :class="getPriorityBadgeClass(issue.priority)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ issue.priority }}
                  </span>
                </div>
                <h4 class="font-medium text-neutral-900 text-sm mb-2">{{ issue.summary }}</h4>
                <div v-if="issue.assignee" class="flex items-center text-xs text-neutral-500">
                  <span class="mdi mdi-account mr-1"></span>
                  {{ issue.assignee.displayName }}
                </div>
              </div>
            </div>
          </div>

          <!-- Done Column -->
          <div class="w-80 bg-success-50 rounded-lg p-4 border border-success-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-success-800 flex items-center">
                <span class="mdi mdi-check-circle mr-2"></span>
                Done
              </h3>
              <span class="bg-success-200 text-success-800 text-xs px-2 py-1 rounded-full">
                {{ kanbanColumns.done.length }}
              </span>
            </div>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="issue in kanbanColumns.done"
                :key="issue.key"
                class="bg-white p-3 rounded-lg shadow-sm border border-success-200 hover:shadow-md transition-shadow cursor-pointer"
                @click="viewIssueInJira(issue.key)"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {{ issue.key }}
                  </span>
                  <span :class="getPriorityBadgeClass(issue.priority)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ issue.priority }}
                  </span>
                </div>
                <h4 class="font-medium text-neutral-900 text-sm mb-2">{{ issue.summary }}</h4>
                <div v-if="issue.assignee" class="flex items-center text-xs text-neutral-500">
                  <span class="mdi mdi-account mr-1"></span>
                  {{ issue.assignee.displayName }}
                </div>
              </div>
            </div>
          </div>

          <!-- Blocked Column -->
          <div class="w-80 bg-error-50 rounded-lg p-4 border border-error-200">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-error-800 flex items-center">
                <span class="mdi mdi-alert-octagon mr-2"></span>
                Blocked
              </h3>
              <span class="bg-error-200 text-error-800 text-xs px-2 py-1 rounded-full">
                {{ kanbanColumns.blocked.length }}
              </span>
            </div>
            <div class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="issue in kanbanColumns.blocked"
                :key="issue.key"
                class="bg-white p-3 rounded-lg shadow-sm border border-error-200 hover:shadow-md transition-shadow cursor-pointer"
                @click="viewIssueInJira(issue.key)"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {{ issue.key }}
                  </span>
                  <span :class="getPriorityBadgeClass(issue.priority)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ issue.priority }}
                  </span>
                </div>
                <h4 class="font-medium text-neutral-900 text-sm mb-2">{{ issue.summary }}</h4>
                <div v-if="issue.assignee" class="flex items-center text-xs text-neutral-500">
                  <span class="mdi mdi-account mr-1"></span>
                  {{ issue.assignee.displayName }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts View -->
      <div v-else-if="currentView === 'charts'" class="space-y-6">
        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Status Distribution Chart -->
          <div class="bg-white rounded-lg border border-neutral-200 p-6">
            <h4 class="font-semibold text-neutral-900 mb-4 flex items-center">
              <span class="mdi mdi-chart-pie mr-2 text-blue-600"></span>
              Status Distribution
            </h4>
            <div class="flex items-center justify-center h-64">
              <!-- Simple donut chart using CSS -->
              <div class="relative w-48 h-48">
                <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <!-- Background circle -->
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="12"></circle>
                  <!-- Status segments -->
                  <circle
                    cx="50" cy="50" r="40" fill="none" 
                    stroke="#22c55e" stroke-width="12"
                    :stroke-dasharray="`${(stats.done / stats.total) * 251.3} 251.3`"
                    :stroke-dashoffset="0"
                    class="transition-all duration-500"
                  ></circle>
                  <circle
                    cx="50" cy="50" r="40" fill="none" 
                    stroke="#f59e0b" stroke-width="12"
                    :stroke-dasharray="`${(stats.inProgress / stats.total) * 251.3} 251.3`"
                    :stroke-dashoffset="`-${(stats.done / stats.total) * 251.3}`"
                    class="transition-all duration-500"
                  ></circle>
                  <circle
                    cx="50" cy="50" r="40" fill="none" 
                    stroke="#eab308" stroke-width="12"
                    :stroke-dasharray="`${(stats.todo / stats.total) * 251.3} 251.3`"
                    :stroke-dashoffset="`-${((stats.done + stats.inProgress) / stats.total) * 251.3}`"
                    class="transition-all duration-500"
                  ></circle>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-neutral-900">{{ stats.total }}</div>
                    <div class="text-sm text-neutral-600">Total</div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Legend -->
            <div class="grid grid-cols-2 gap-4 mt-4">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span class="text-sm text-neutral-700">To Do ({{ stats.todo }})</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                <span class="text-sm text-neutral-700">In Progress ({{ stats.inProgress }})</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 bg-success-500 rounded-full mr-2"></div>
                <span class="text-sm text-neutral-700">Done ({{ stats.done }})</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 bg-error-500 rounded-full mr-2"></div>
                <span class="text-sm text-neutral-700">Blocked ({{ blockedIssues.length }})</span>
              </div>
            </div>
          </div>

          <!-- Priority Breakdown -->
          <div class="bg-white rounded-lg border border-neutral-200 p-6">
            <h4 class="font-semibold text-neutral-900 mb-4 flex items-center">
              <span class="mdi mdi-flag mr-2 text-red-600"></span>
              Priority Breakdown
            </h4>
            <div class="space-y-3">
              <div v-for="(count, priority) in priorityStats" :key="priority" class="flex items-center justify-between">
                <div class="flex items-center">
                  <div :class="getPriorityColor(priority)" class="w-3 h-3 rounded-full mr-3"></div>
                  <span class="text-sm font-medium text-neutral-700">{{ priority }}</span>
                </div>
                <div class="flex items-center">
                  <div class="w-24 bg-neutral-200 rounded-full h-2 mr-3">
                    <div
                      :class="getPriorityColor(priority)"
                      class="h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${(count / stats.total) * 100}%` }"
                    ></div>
                  </div>
                  <span class="text-sm font-medium text-neutral-900 w-6 text-right">{{ count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Timeline Chart -->
          <div class="bg-white rounded-lg border border-neutral-200 p-6 col-span-full">
            <h4 class="font-semibold text-neutral-900 mb-4 flex items-center">
              <span class="mdi mdi-chart-timeline-variant mr-2 text-purple-600"></span>
              Issue Creation Timeline (Last 30 Days)
            </h4>
            <div class="h-40 flex items-end space-x-1">
              <div
                v-for="(count, index) in timelineData"
                :key="index"
                class="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t min-h-[4px] transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                :style="{ height: `${Math.max((count / Math.max(...timelineData)) * 100, 4)}%` }"
                :title="`${count} issues created ${30 - index} days ago`"
              ></div>
            </div>
            <div class="flex justify-between mt-2 text-xs text-neutral-500">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>

          <!-- Assignee Workload -->
          <div class="bg-white rounded-lg border border-neutral-200 p-6 col-span-full">
            <h4 class="font-semibold text-neutral-900 mb-4 flex items-center">
              <span class="mdi mdi-account-group mr-2 text-green-600"></span>
              Assignee Workload
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div
                v-for="(data, assignee) in assigneeStats"
                :key="assignee"
                class="bg-neutral-50 rounded-lg p-4 border border-neutral-200"
              >
                <div class="flex items-center justify-between mb-2">
                  <h5 class="font-medium text-neutral-900 text-sm truncate">{{ assignee }}</h5>
                  <span class="text-lg font-bold text-blue-600">{{ data.total }}</span>
                </div>
                <div class="space-y-1">
                  <div class="flex justify-between text-xs">
                    <span class="text-neutral-600">Active</span>
                    <span class="font-medium">{{ data.active }}</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-neutral-600">Completed</span>
                    <span class="font-medium">{{ data.completed }}</span>
                  </div>
                </div>
                <div class="mt-2 h-2 bg-neutral-200 rounded-full">
                  <div
                    class="h-2 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300"
                    :style="{ width: `${(data.completed / data.total) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

// New reactive state for views and enhanced features
const currentView = ref('list')
const timelineData = ref(Array(30).fill(0))
const priorityStats = computed(() => {
  const stats = {}
  issues.value.forEach(issue => {
    const priority = issue.priority || 'Medium'
    stats[priority] = (stats[priority] || 0) + 1
  })
  return stats
})

const assigneeStats = computed(() => {
  const stats = {}
  issues.value.forEach(issue => {
    const assignee = issue.assignee?.displayName || 'Unassigned'
    if (!stats[assignee]) {
      stats[assignee] = { total: 0, active: 0, completed: 0 }
    }
    stats[assignee].total++
    if (['Done', 'Closed', 'Resolved'].includes(issue.status.name)) {
      stats[assignee].completed++
    } else {
      stats[assignee].active++
    }
  })
  return stats
})

const kanbanColumns = computed(() => {
  return {
    todo: issues.value.filter(issue => ['To Do', 'Open', 'New'].includes(issue.status.name)),
    inProgress: issues.value.filter(issue => ['In Progress', 'In Review'].includes(issue.status.name)),
    done: issues.value.filter(issue => ['Done', 'Closed', 'Resolved'].includes(issue.status.name)),
    blocked: issues.value.filter(issue => ['Blocked', 'Impediment'].includes(issue.status.name))
  }
})

const blockedIssues = computed(() => {
  return issues.value.filter(issue => ['Blocked', 'Impediment'].includes(issue.status.name))
})

// Get priority color for charts
const getPriorityColor = (priority) => {
  const priorityLower = priority.toLowerCase()
  if (['highest', 'critical'].includes(priorityLower)) {
    return 'bg-error-500'
  } else if (['high'].includes(priorityLower)) {
    return 'bg-warning-500'
  } else if (['medium'].includes(priorityLower)) {
    return 'bg-yellow-500'
  } else {
    return 'bg-neutral-400'
  }
}

// Generate timeline data when issues are loaded
const generateTimelineData = () => {
  const data = Array(30).fill(0)
  const now = new Date()
  
  issues.value.forEach(issue => {
    const createdDate = new Date(issue.created)
    const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24))
    if (daysDiff >= 0 && daysDiff < 30) {
      data[29 - daysDiff]++
    }
  })
  
  timelineData.value = data
}

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

    // Generate timeline data after loading issues
    if (!append) {
      generateTimelineData()
    }
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
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Kanban board animations */
.kanban-card {
  transition: all 0.2s ease;
}

.kanban-card:hover {
  transform: translateY(-2px);
}

/* Chart animations */
@keyframes drawCircle {
  from {
    stroke-dasharray: 0 251.3;
  }
}

circle {
  animation: drawCircle 1s ease-out;
}

/* Timeline bars hover effect */
.timeline-bar {
  transition: all 0.2s ease;
}

.timeline-bar:hover {
  transform: scaleY(1.1);
}
</style>