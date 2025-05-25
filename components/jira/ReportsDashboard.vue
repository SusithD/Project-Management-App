<template>
  <div class="bg-white rounded-lg shadow-md border border-neutral-200 p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-neutral-800 flex items-center">
          <span class="mdi mdi-chart-line text-green-600 mr-2"></span>
          JIRA Reports & Analytics
        </h3>
        <p class="text-sm text-neutral-600 mt-1">
          Comprehensive metrics and insights from your JIRA project
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="refreshReports"
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <span :class="['mdi mdi-refresh mr-2', { 'mdi-spin': loading }]"></span>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="mdi mdi-loading mdi-spin text-4xl text-blue-600 mb-4"></div>
        <p class="text-gray-600">Loading JIRA metrics...</p>
      </div>
    </div>

    <!-- Reports Content -->
    <div v-else-if="reportData" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div class="flex items-center">
            <span class="mdi mdi-ticket text-blue-600 text-2xl mr-3"></span>
            <div>
              <p class="text-sm text-blue-700 font-medium">Total Issues</p>
              <p class="text-2xl font-bold text-blue-900">{{ reportData.metrics.totalIssues }}</p>
            </div>
          </div>
        </div>

        <div class="bg-green-50 p-4 rounded-lg border border-green-200">
          <div class="flex items-center">
            <span class="mdi mdi-check-circle text-green-600 text-2xl mr-3"></span>
            <div>
              <p class="text-sm text-green-700 font-medium">Completed</p>
              <p class="text-2xl font-bold text-green-900">{{ completedIssues }}</p>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div class="flex items-center">
            <span class="mdi mdi-clock text-yellow-600 text-2xl mr-3"></span>
            <div>
              <p class="text-sm text-yellow-700 font-medium">Avg Resolution</p>
              <p class="text-2xl font-bold text-yellow-900">{{ avgResolutionDays }}d</p>
            </div>
          </div>
        </div>

        <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div class="flex items-center">
            <span class="mdi mdi-speedometer text-purple-600 text-2xl mr-3"></span>
            <div>
              <p class="text-sm text-purple-700 font-medium">Velocity</p>
              <p class="text-2xl font-bold text-purple-900">{{ reportData.metrics.velocity.current }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Issues by Status Chart -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-4">Issues by Status</h4>
          <div class="space-y-2">
            <div
              v-for="(count, status) in reportData.metrics.issuesByStatus"
              :key="status"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-700">{{ status }}</span>
              <div class="flex items-center">
                <div class="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    class="bg-blue-600 h-2 rounded-full"
                    :style="{ width: `${(count / reportData.metrics.totalIssues) * 100}%` }"
                  ></div>
                </div>
                <span class="text-sm font-medium text-gray-900 w-8 text-right">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Issues by Priority Chart -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium text-gray-900 mb-4">Issues by Priority</h4>
          <div class="space-y-2">
            <div
              v-for="(count, priority) in reportData.metrics.issuesByPriority"
              :key="priority"
              class="flex items-center justify-between"
            >
              <span class="text-sm text-gray-700">{{ priority }}</span>
              <div class="flex items-center">
                <div class="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    :class="getPriorityColor(priority)"
                    class="h-2 rounded-full"
                    :style="{ width: `${(count / reportData.metrics.totalIssues) * 100}%` }"
                  ></div>
                </div>
                <span class="text-sm font-medium text-gray-900 w-8 text-right">{{ count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Issue Types -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-medium text-gray-900 mb-4">Issues by Type</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="(count, type) in reportData.metrics.issuesByType"
            :key="type"
            class="text-center bg-white p-3 rounded border"
          >
            <p class="text-2xl font-bold text-gray-900">{{ count }}</p>
            <p class="text-sm text-gray-600">{{ type }}</p>
          </div>
        </div>
      </div>

      <!-- Burndown Chart -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-medium text-gray-900 mb-4">30-Day Burndown</h4>
        <div class="h-64 flex items-end space-x-1">
          <div
            v-for="(point, index) in burndownData"
            :key="index"
            class="flex-1 flex flex-col justify-end"
          >
            <div class="bg-blue-600 rounded-t" :style="{ height: `${point.height}px` }"></div>
            <div class="text-xs text-gray-600 text-center mt-1 transform -rotate-45">
              {{ formatDateShort(point.date) }}
            </div>
          </div>
        </div>
        <div class="flex justify-between text-sm text-gray-600 mt-4">
          <span>Remaining Issues Over Time</span>
          <span>Current: {{ reportData.metrics.burndown[reportData.metrics.burndown.length - 1]?.remaining || 0 }}</span>
        </div>
      </div>

      <!-- Export Options -->
      <div class="border-t pt-4">
        <h4 class="font-medium text-gray-900 mb-3">Export Reports</h4>
        <div class="flex space-x-3">
          <button
            @click="exportReport('pdf')"
            :disabled="exporting"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span class="mdi mdi-file-pdf-box text-red-600 mr-2"></span>
            Export PDF
          </button>
          
          <button
            @click="exportReport('excel')"
            :disabled="exporting"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span class="mdi mdi-file-excel text-green-600 mr-2"></span>
            Export Excel
          </button>
          
          <button
            @click="exportReport('json')"
            :disabled="exporting"
            class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span class="mdi mdi-code-json text-blue-600 mr-2"></span>
            Export JSON
          </button>
        </div>
      </div>

      <!-- Last Updated -->
      <div class="text-xs text-gray-500 text-center">
        Last updated: {{ formatDate(reportData.lastUpdated) }}
      </div>
    </div>

    <!-- No Data State -->
    <div v-else-if="!loading && !reportData" class="text-center py-12">
      <div class="mdi mdi-chart-line text-4xl text-gray-400 mb-4"></div>
      <p class="text-gray-600 mb-4">No JIRA data available</p>
      <button
        @click="refreshReports"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Load Reports
      </button>
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

// Stores
const notificationsStore = useNotificationsStore();

// Reactive data
const loading = ref(false);
const exporting = ref(false);
const reportData = ref(null);

// Computed
const completedIssues = computed(() => {
  if (!reportData.value) return 0;
  return Object.entries(reportData.value.metrics.issuesByStatus)
    .filter(([status]) => ['Done', 'Closed', 'Resolved'].includes(status))
    .reduce((sum, [, count]) => sum + count, 0);
});

const avgResolutionDays = computed(() => {
  if (!reportData.value) return 0;
  return Math.round(reportData.value.metrics.averageResolutionTime * 10) / 10;
});

const burndownData = computed(() => {
  if (!reportData.value?.metrics.burndown) return [];
  
  const maxRemaining = Math.max(...reportData.value.metrics.burndown.map(p => p.remaining));
  const maxHeight = 200; // Max height in pixels
  
  return reportData.value.metrics.burndown.map(point => ({
    ...point,
    height: maxRemaining > 0 ? (point.remaining / maxRemaining) * maxHeight : 0
  }));
});

// Methods
const refreshReports = async () => {
  if (!props.project.jiraIntegration?.projectKey) {
    notificationsStore.error('Project is not linked to JIRA');
    return;
  }
  
  loading.value = true;
  try {
    console.log('[Reports Dashboard] Fetching reports for project:', props.project._id || props.project.id);
    
    const response = await fetch(`/api/jira/reports?projectId=${props.project._id || props.project.id}&includeMetrics=true`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('[Reports Dashboard] API response:', data);
    
    if (data.body?.success) {
      reportData.value = data.body.data;
      notificationsStore.success('Reports refreshed successfully');
    } else {
      // Log detailed error information
      console.error('[Reports Dashboard] API returned error:', data.body);
      
      const errorMessage = data.body?.message || 'Failed to load reports';
      const errorDetails = data.body?.details;
      
      if (errorDetails && process.env.NODE_ENV === 'development') {
        console.error('[Reports Dashboard] Error details:', errorDetails);
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error loading reports:', error);
    
    // Provide more specific error messages based on the error type
    let userMessage = 'Failed to load JIRA reports';
    
    if (error.message.includes('authentication')) {
      userMessage = 'JIRA authentication failed. Please check your credentials in settings.';
    } else if (error.message.includes('project not found') || error.message.includes('Cannot access JIRA project')) {
      userMessage = `JIRA project "${props.project.jiraIntegration?.projectKey}" not found or inaccessible.`;
    } else if (error.message.includes('Invalid request payload')) {
      userMessage = 'JIRA API request format error. The project key might be invalid.';
    } else if (error.message.includes('rate limit')) {
      userMessage = 'JIRA rate limit exceeded. Please try again in a few minutes.';
    } else if (error.message.includes('network') || error.message.includes('connect')) {
      userMessage = 'Unable to connect to JIRA. Please check your network connection.';
    }
    
    notificationsStore.error(userMessage);
  } finally {
    loading.value = false;
  }
};

const exportReport = async (format) => {
  if (!reportData.value) return;
  
  exporting.value = true;
  try {
    let content, filename, mimeType;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(reportData.value, null, 2);
        filename = `jira-report-${props.project.name}-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
        
      case 'excel':
        // Create CSV content for Excel compatibility
        const csvData = [
          ['Metric', 'Value'],
          ['Total Issues', reportData.value.metrics.totalIssues],
          ['Completed Issues', completedIssues.value],
          ['Average Resolution Days', avgResolutionDays.value],
          ['Current Velocity', reportData.value.metrics.velocity.current],
          [''],
          ['Status', 'Count'],
          ...Object.entries(reportData.value.metrics.issuesByStatus),
          [''],
          ['Priority', 'Count'],
          ...Object.entries(reportData.value.metrics.issuesByPriority),
          [''],
          ['Type', 'Count'],
          ...Object.entries(reportData.value.metrics.issuesByType)
        ];
        content = csvData.map(row => row.join(',')).join('\n');
        filename = `jira-report-${props.project.name}-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;
        
      case 'pdf':
        // For PDF, we'll create a simple text report
        content = `JIRA Report - ${props.project.name}\n` +
                 `Generated: ${new Date().toLocaleDateString()}\n\n` +
                 `Summary:\n` +
                 `- Total Issues: ${reportData.value.metrics.totalIssues}\n` +
                 `- Completed Issues: ${completedIssues.value}\n` +
                 `- Average Resolution: ${avgResolutionDays.value} days\n` +
                 `- Current Velocity: ${reportData.value.metrics.velocity.current}\n\n` +
                 `Issues by Status:\n` +
                 Object.entries(reportData.value.metrics.issuesByStatus)
                   .map(([status, count]) => `- ${status}: ${count}`)
                   .join('\n') + '\n\n' +
                 `Issues by Priority:\n` +
                 Object.entries(reportData.value.metrics.issuesByPriority)
                   .map(([priority, count]) => `- ${priority}: ${count}`)
                   .join('\n');
        filename = `jira-report-${props.project.name}-${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
        break;
    }
    
    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    notificationsStore.success(`Report exported as ${format.toUpperCase()}`);
  } catch (error) {
    console.error('Error exporting report:', error);
    notificationsStore.error('Failed to export report');
  } finally {
    exporting.value = false;
  }
};

const getPriorityColor = (priority) => {
  const colors = {
    'Highest': 'bg-red-600',
    'High': 'bg-orange-500',
    'Medium': 'bg-yellow-500',
    'Low': 'bg-green-500',
    'Lowest': 'bg-blue-500'
  };
  return colors[priority] || 'bg-gray-500';
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
};

const formatDateShort = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Load reports on mount
onMounted(() => {
  if (props.project.jiraIntegration?.projectKey) {
    refreshReports();
  }
});
</script>