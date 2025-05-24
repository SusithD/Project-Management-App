<template>
  <div class="relative">
    <!-- Loading overlay -->
    <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-3 text-neutral-700 font-medium">Loading your tasks from JIRA...</p>
      </div>
    </div>

    <!-- Header with enhanced info -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div class="flex flex-col w-full md:w-auto mb-4 md:mb-0">
        <h1 class="text-3xl font-bold text-neutral-900 mb-2 flex items-center">
          <span class="mdi mdi-account-check text-primary-600 mr-3"></span>
          My Tasks
        </h1>
        <p class="text-neutral-600">Tasks assigned to you across all JIRA projects</p>
        <div v-if="userTasksData?.stats" class="flex items-center mt-2 text-sm text-neutral-500">
          <span class="mdi mdi-information mr-1"></span>
          {{ userTasksData.stats.jiraIntegratedProjects }} JIRA projects • Last updated: {{ formatDate(new Date()) }}
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row w-full md:w-auto gap-4">
        <!-- View Mode Toggle -->
        <div class="flex bg-neutral-100 rounded-lg p-1">
          <button
            @click="viewMode = 'projects'"
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              viewMode === 'projects' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            ]"
          >
            <span class="mdi mdi-folder-multiple mr-1"></span>By Projects
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              viewMode === 'list' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            ]"
          >
            <span class="mdi mdi-view-list mr-1"></span>All Tasks
          </button>
          <button
            @click="viewMode = 'kanban'"
            :class="[
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              viewMode === 'kanban' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
            ]"
          >
            <span class="mdi mdi-view-column mr-1"></span>Kanban
          </button>
        </div>

        <!-- Search -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="mdi mdi-magnify text-gray-400"></span>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tasks..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <!-- Refresh Button -->
        <button 
          @click="fetchUserTasks"
          :disabled="loading"
          class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
        >
          <span :class="['mdi mr-2', loading ? 'mdi-loading mdi-spin' : 'mdi-refresh']"></span>
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Enhanced Stats Cards Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <!-- Total Tasks -->
      <div class="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl shadow-card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-blue-200">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <span class="mdi mdi-checkbox-marked-outline text-2xl"></span>
          </div>
          <span class="text-2xl font-bold text-blue-900">{{ userTasksData?.stats?.totalTasks || 0 }}</span>
        </div>
        <h3 class="text-sm font-medium text-blue-800">Total Tasks</h3>
        <div class="mt-2 h-1.5 bg-blue-200 rounded-full">
          <div class="h-1.5 bg-blue-600 rounded-full" style="width: 100%"></div>
        </div>
      </div>
      
      <!-- In Progress -->
      <div class="bg-gradient-to-r from-orange-50 to-orange-100 p-5 rounded-xl shadow-card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-orange-200">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 rounded-lg bg-orange-600 flex items-center justify-center text-white">
            <span class="mdi mdi-clock-outline text-2xl"></span>
          </div>
          <span class="text-2xl font-bold text-orange-900">{{ userTasksData?.stats?.inProgressTasks || 0 }}</span>
        </div>
        <h3 class="text-sm font-medium text-orange-800">In Progress</h3>
        <div class="mt-2 h-1.5 bg-orange-200 rounded-full">
          <div 
            class="h-1.5 bg-orange-600 rounded-full transition-all duration-500" 
            :style="{ width: `${getProgressWidth('inProgress')}%` }"
          ></div>
        </div>
      </div>
      
      <!-- Completed -->
      <div class="bg-gradient-to-r from-success-50 to-success-100 p-5 rounded-xl shadow-card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-success-200">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 rounded-lg bg-success-600 flex items-center justify-center text-white">
            <span class="mdi mdi-check-circle-outline text-2xl"></span>
          </div>
          <span class="text-2xl font-bold text-success-900">{{ userTasksData?.stats?.completedTasks || 0 }}</span>
        </div>
        <h3 class="text-sm font-medium text-success-800">Completed</h3>
        <div class="mt-2 h-1.5 bg-success-200 rounded-full">
          <div 
            class="h-1.5 bg-success-600 rounded-full transition-all duration-500" 
            :style="{ width: `${getProgressWidth('completed')}%` }"
          ></div>
        </div>
      </div>
      
      <!-- Overdue -->
      <div class="bg-gradient-to-r from-error-50 to-error-100 p-5 rounded-xl shadow-card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-error-200">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 rounded-lg bg-error-600 flex items-center justify-center text-white">
            <span class="mdi mdi-alert-circle-outline text-2xl"></span>
          </div>
          <span class="text-2xl font-bold text-error-900">{{ userTasksData?.stats?.overdueTasks || 0 }}</span>
        </div>
        <h3 class="text-sm font-medium text-error-800">Overdue</h3>
        <div class="mt-2 h-1.5 bg-error-200 rounded-full">
          <div 
            class="h-1.5 bg-error-600 rounded-full transition-all duration-500" 
            :style="{ width: `${getProgressWidth('overdue')}%` }"
          ></div>
        </div>
      </div>

      <!-- Projects -->
      <div class="bg-gradient-to-r from-purple-50 to-purple-100 p-5 rounded-xl shadow-card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-purple-200">
        <div class="flex items-center justify-between mb-3">
          <div class="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white">
            <span class="mdi mdi-folder-multiple text-2xl"></span>
          </div>
          <span class="text-2xl font-bold text-purple-900">{{ userTasksData?.stats?.jiraIntegratedProjects || 0 }}</span>
        </div>
        <h3 class="text-sm font-medium text-purple-800">JIRA Projects</h3>
        <div class="mt-2 h-1.5 bg-purple-200 rounded-full">
          <div class="h-1.5 bg-purple-600 rounded-full" style="width: 100%"></div>
        </div>
      </div>
    </div>

    <!-- Content based on view mode -->
    <div v-if="userTasksData?.projects?.length > 0">
      <!-- Projects View -->
      <div v-if="viewMode === 'projects'" class="space-y-6">
        <div
          v-for="project in filteredProjects"
          :key="project.projectId"
          class="bg-white rounded-xl shadow-card border border-neutral-200 overflow-hidden"
        >
          <!-- Project Header -->
          <div class="bg-gradient-to-r from-neutral-50 to-neutral-100 px-6 py-4 border-b border-neutral-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mr-4">
                  <span v-if="project.isJiraIntegrated" class="mdi mdi-jira text-primary-600 text-xl"></span>
                  <span v-else class="mdi mdi-folder text-primary-600 text-xl"></span>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900 flex items-center">
                    {{ project.projectName }}
                    <span v-if="project.projectKey" class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                      {{ project.projectKey }}
                    </span>
                  </h3>
                  <p class="text-sm text-neutral-600">
                    {{ project.tasks.length }} task{{ project.tasks.length !== 1 ? 's' : '' }} assigned to you
                    <span v-if="project.isJiraIntegrated" class="ml-2 text-blue-600">• JIRA Integrated</span>
                  </p>
                </div>
              </div>
              
              <div class="flex items-center space-x-3">
                <!-- Project task stats -->
                <div class="flex items-center space-x-4 text-sm">
                  <div class="flex items-center text-orange-600">
                    <span class="w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
                    {{ getProjectTasksByStatus(project, 'In Progress').length }}
                  </div>
                  <div class="flex items-center text-success-600">
                    <span class="w-2 h-2 bg-success-500 rounded-full mr-1"></span>
                    {{ getProjectTasksByStatus(project, 'Done').length }}
                  </div>
                  <div class="flex items-center text-error-600">
                    <span class="w-2 h-2 bg-error-500 rounded-full mr-1"></span>
                    {{ getProjectOverdueTasks(project).length }}
                  </div>
                </div>
                
                <!-- Expand/Collapse -->
                <button
                  @click="toggleProjectExpansion(project.projectId)"
                  class="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 rounded-md transition-colors"
                >
                  <span :class="[
                    'mdi text-lg transition-transform duration-200',
                    expandedProjects.includes(project.projectId) ? 'mdi-chevron-up' : 'mdi-chevron-down'
                  ]"></span>
                </button>
              </div>
            </div>
          </div>

          <!-- Project Tasks -->
          <div v-show="expandedProjects.includes(project.projectId)" class="p-6">
            <div v-if="project.tasks.length === 0" class="text-center py-8 text-neutral-500">
              <span class="mdi mdi-clipboard-text-outline text-4xl block mb-2"></span>
              <p>No tasks assigned in this project</p>
            </div>
            
            <div v-else class="space-y-3">
              <div
                v-for="task in project.tasks"
                :key="task.id"
                class="flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors group"
              >
                <!-- Task Icon & Checkbox -->
                <div class="flex items-center mr-4">
                  <input 
                    type="checkbox" 
                    :checked="isTaskCompleted(task)"
                    @change="toggleTaskStatus(task)"
                    class="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>

                <!-- Task Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <!-- Task Title & Issue Key -->
                      <div class="flex items-center mb-1">
                        <h4 :class="[
                          'font-medium mr-3',
                          isTaskCompleted(task) ? 'text-neutral-500 line-through' : 'text-neutral-900'
                        ]">
                          {{ task.title }}
                        </h4>
                        <span v-if="task.issueKey" class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                          {{ task.issueKey }}
                        </span>
                        <span v-if="task.issueType" class="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          {{ task.issueType }}
                        </span>
                      </div>
                      
                      <!-- Description -->
                      <p v-if="task.description" class="text-sm text-neutral-600 mb-2 line-clamp-2">
                        {{ stripHtml(task.description) }}
                      </p>
                      
                      <!-- Task Meta -->
                      <div class="flex items-center text-xs text-neutral-500 space-x-4">
                        <div v-if="task.dueDate" class="flex items-center">
                          <span class="mdi mdi-calendar mr-1"></span>
                          <span :class="{ 'text-error-600 font-medium': isTaskOverdue(task) }">
                            Due {{ formatDate(task.dueDate) }}
                            <span v-if="isTaskOverdue(task)" class="ml-1">(Overdue)</span>
                          </span>
                        </div>
                        <div class="flex items-center">
                          <span class="mdi mdi-clock-outline mr-1"></span>
                          Updated {{ formatRelativeDate(task.updated) }}
                        </div>
                        <div v-if="task.components?.length" class="flex items-center">
                          <span class="mdi mdi-tag mr-1"></span>
                          {{ task.components.join(', ') }}
                        </div>
                      </div>
                    </div>

                    <!-- Task Status & Priority -->
                    <div class="flex items-center space-x-2 ml-4">
                      <span :class="getStatusBadgeClass(task.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ task.status }}
                      </span>
                      <span :class="getPriorityBadgeClass(task.priority)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ task.priority }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Task Actions -->
                <div class="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    v-if="task.jiraUrl"
                    @click="openInJira(task.jiraUrl)"
                    class="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Open in JIRA"
                  >
                    <span class="mdi mdi-open-in-new text-base"></span>
                  </button>
                  <button
                    @click="viewTaskDetails(task)"
                    class="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                    title="View Details"
                  >
                    <span class="mdi mdi-eye text-base"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- All Tasks List View -->
      <div v-else-if="viewMode === 'list'" class="bg-white rounded-xl shadow-card">
        <div class="border-b border-neutral-200 p-6">
          <h2 class="text-xl font-semibold text-neutral-800">All Tasks</h2>
          <p class="text-sm text-neutral-600 mt-1">{{ allTasks.length }} tasks from {{ userTasksData.projects.length }} projects</p>
        </div>

        <!-- Tabs Navigation -->
        <div class="border-b border-neutral-200 px-6">
          <div class="flex">
            <button 
              @click="selectedTab = 'all'" 
              :class="[
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
                selectedTab === 'all' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              ]"
            >
              All Tasks
            </button>
            <button 
              @click="selectedTab = 'active'" 
              :class="[
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
                selectedTab === 'active' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              ]"
            >
              Active
            </button>
            <button 
              @click="selectedTab = 'completed'" 
              :class="[
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
                selectedTab === 'completed' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              ]"
            >
              Completed
            </button>
            <button 
              @click="selectedTab = 'overdue'" 
              :class="[
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
                selectedTab === 'overdue' 
                  ? 'border-primary-600 text-primary-600' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              ]"
            >
              Overdue
            </button>
          </div>
        </div>

        <!-- Enhanced Tasks Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-neutral-200">
            <thead class="bg-neutral-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Task</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Project</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Issue Key</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Due Date</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Priority</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-neutral-200">
              <tr v-if="allTasks.length === 0">
                <td colspan="7" class="px-6 py-10 text-center text-neutral-500">
                  <div class="flex flex-col items-center">
                    <span class="mdi mdi-clipboard-text-outline text-5xl text-neutral-300 mb-2"></span>
                    <p class="text-lg font-medium">No tasks found</p>
                    <p class="text-sm mt-1">{{ searchQuery ? 'Try a different search term' : 'You have no tasks assigned currently' }}</p>
                  </div>
                </td>
              </tr>
              <tr v-for="task in allTasks" :key="task.id" class="hover:bg-neutral-50">
                <td class="px-6 py-4">
                  <div class="flex items-start">
                    <div class="flex-shrink-0">
                      <input 
                        type="checkbox" 
                        :checked="isTaskCompleted(task)"
                        @change="toggleTaskStatus(task)"
                        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div class="ml-3">
                      <div :class="[
                        'text-sm font-medium',
                        isTaskCompleted(task) ? 'text-neutral-500 line-through' : 'text-neutral-900'
                      ]">
                        {{ task.title }}
                      </div>
                      <div v-if="task.description" class="text-sm text-neutral-500 mt-1 line-clamp-1">
                        {{ stripHtml(task.description) }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-neutral-900">{{ getProjectName(task.projectId) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span v-if="task.issueKey" class="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">
                    {{ task.issueKey }}
                  </span>
                  <span v-else class="text-neutral-400 text-xs">-</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="task.dueDate" :class="[
                    'text-sm',
                    isTaskOverdue(task) ? 'text-error-600 font-medium' : 'text-neutral-900'
                  ]">
                    {{ formatDate(task.dueDate) }}
                    <span v-if="isTaskOverdue(task)" class="text-xs font-medium ml-1 text-error-600">
                      (Overdue)
                    </span>
                  </div>
                  <span v-else class="text-neutral-400 text-sm">No due date</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusBadgeClass(task.status)" class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ task.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getPriorityBadgeClass(task.priority)" class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ task.priority }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end space-x-2">
                    <button
                      v-if="task.jiraUrl"
                      @click="openInJira(task.jiraUrl)"
                      class="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Open in JIRA"
                    >
                      <span class="mdi mdi-open-in-new text-lg"></span>
                    </button>
                    <button 
                      @click="viewTaskDetails(task)" 
                      class="text-primary-600 hover:text-primary-800 transition-colors"
                      title="View Details"
                    >
                      <span class="mdi mdi-eye text-lg"></span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Kanban View -->
      <div v-else-if="viewMode === 'kanban'" class="overflow-x-auto">
        <div class="flex space-x-6 min-w-max pb-4">
          <!-- To Do Column -->
          <div class="w-80 bg-neutral-50 rounded-lg border border-neutral-200">
            <div class="p-4 border-b border-neutral-200 bg-neutral-100">
              <h3 class="font-semibold text-neutral-800 flex items-center justify-between">
                <span class="flex items-center">
                  <span class="mdi mdi-clock-outline mr-2 text-neutral-600"></span>
                  To Do
                </span>
                <span class="bg-neutral-200 text-neutral-700 text-xs px-2 py-1 rounded-full">
                  {{ kanbanColumns.todo.length }}
                </span>
              </h3>
            </div>
            <div class="p-4 space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="task in kanbanColumns.todo"
                :key="task.id"
                class="flex items-center p-3 bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
              >
                <input 
                  type="checkbox" 
                  :checked="isTaskCompleted(task)"
                  @change="toggleTaskStatus(task)"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="text-sm font-medium text-neutral-900">
                        {{ task.title }}
                      </div>
                      <div v-if="task.description" class="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {{ stripHtml(task.description) }}
                      </div>
                    </div>

                    <div class="flex items-center space-x-2 ml-4">
                      <span :class="getStatusBadgeClass(task.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ task.status }}
                      </span>
                      <span :class="getPriorityBadgeClass(task.priority)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ task.priority }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="w-80 bg-neutral-50 rounded-lg border border-neutral-200">
            <div class="p-4 border-b border-neutral-200 bg-neutral-100">
              <h3 class="font-semibold text-neutral-800 flex items-center justify-between">
                <span class="flex items-center">
                  <span class="mdi mdi-arrow-right-thin mr-2 text-neutral-600"></span>
                  In Progress
                </span>
                <span class="bg-neutral-200 text-neutral-700 text-xs px-2 py-1 rounded-full">
                  {{ kanbanColumns.inProgress.length }}
                </span>
              </h3>
            </div>
            <div class="p-4 space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="task in kanbanColumns.inProgress"
                :key="task.id"
                class="flex items-center p-3 bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
              >
                <input 
                  type="checkbox" 
                  :checked="isTaskCompleted(task)"
                  @change="toggleTaskStatus(task)"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="text-sm font-medium text-neutral-900">
                        {{ task.title }}
                      </div>
                      <div v-if="task.description" class="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {{ stripHtml(task.description) }}
                      </div>
                    </div>

                    <div class="flex items-center space-x-2 ml-4">
                      <span :class="getStatusBadgeClass(task.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ task.status }}
                      </span>
                      <span :class="getPriorityBadgeClass(task.priority)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ task.priority }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Done Column -->
          <div class="w-80 bg-neutral-50 rounded-lg border border-neutral-200">
            <div class="p-4 border-b border-neutral-200 bg-neutral-100">
              <h3 class="font-semibold text-neutral-800 flex items-center justify-between">
                <span class="flex items-center">
                  <span class="mdi mdi-check-all mr-2 text-neutral-600"></span>
                  Done
                </span>
                <span class="bg-neutral-200 text-neutral-700 text-xs px-2 py-1 rounded-full">
                  {{ kanbanColumns.done.length }}
                </span>
              </h3>
            </div>
            <div class="p-4 space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="task in kanbanColumns.done"
                :key="task.id"
                class="flex items-center p-3 bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
              >
                <input 
                  type="checkbox" 
                  :checked="isTaskCompleted(task)"
                  @change="toggleTaskStatus(task)"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="text-sm font-medium text-neutral-900">
                        {{ task.title }}
                      </div>
                      <div v-if="task.description" class="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {{ stripHtml(task.description) }}
                      </div>
                    </div>

                    <div class="flex items-center space-x-2 ml-4">
                      <span :class="getStatusBadgeClass(task.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ task.status }}
                      </span>
                      <span :class="getPriorityBadgeClass(task.priority)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ task.priority }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Blocked Column -->
          <div class="w-80 bg-neutral-50 rounded-lg border border-neutral-200">
            <div class="p-4 border-b border-neutral-200 bg-neutral-100">
              <h3 class="font-semibold text-neutral-800 flex items-center justify-between">
                <span class="flex items-center">
                  <span class="mdi mdi-alert-circle-outline mr-2 text-neutral-600"></span>
                  Blocked
                </span>
                <span class="bg-neutral-200 text-neutral-700 text-xs px-2 py-1 rounded-full">
                  {{ kanbanColumns.blocked.length }}
                </span>
              </h3>
            </div>
            <div class="p-4 space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="task in kanbanColumns.blocked"
                :key="task.id"
                class="flex items-center p-3 bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
              >
                <input 
                  type="checkbox" 
                  :checked="isTaskCompleted(task)"
                  @change="toggleTaskStatus(task)"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-3"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="text-sm font-medium text-neutral-900">
                        {{ task.title }}
                      </div>
                      <div v-if="task.description" class="text-xs text-neutral-500 mt-1 line-clamp-2">
                        {{ stripHtml(task.description) }}
                      </div>
                    </div>

                    <div class="flex items-center space-x-2 ml-4">
                      <span :class="getStatusBadgeClass(task.status)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ task.status }}
                      </span>
                      <span :class="getPriorityBadgeClass(task.priority)" class="px-2 py-1 text-xs font-medium rounded-full">
                        {{ task.priority }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="text-center py-12">
      <div class="flex flex-col items-center">
        <div class="mb-4 bg-neutral-100 rounded-full p-6 w-20 h-20 flex items-center justify-center">
          <span class="mdi mdi-clipboard-check-outline text-4xl text-neutral-500"></span>
        </div>
        <h3 class="text-lg font-medium text-neutral-900 mb-1">No JIRA tasks found</h3>
        <p class="text-neutral-500 max-w-sm mx-auto mb-4">
          You don't have any JIRA tasks assigned across your projects. Tasks will appear here when they are assigned to you in JIRA.
        </p>
        <button
          @click="fetchUserTasks"
          class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <span class="mdi mdi-refresh mr-2"></span>
          Refresh Tasks
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useNotificationsStore } from '~/stores/notifications'

definePageMeta({
  layout: 'dashboard'
})

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()

// Reactive data
const userTasksData = ref(null)
const loading = ref(true)
const searchQuery = ref('')
const viewMode = ref('projects') // 'projects', 'list', 'kanban'
const expandedProjects = ref([])
const selectedTab = ref('all') // 'all', 'active', 'completed', 'overdue'

// Fetch user tasks from JIRA
const fetchUserTasks = async () => {
  loading.value = true
  try {
    const userEmail = authStore.userEmail
    if (!userEmail) {
      throw new Error('User email not found. Please log in again.')
    }

    const response = await fetch(`/api/tasks/my?userEmail=${encodeURIComponent(userEmail)}`, {
      headers: {
        'Authorization': authStore.authHeader
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`)
    }

    const data = await response.json()
    if (data.success) {
      userTasksData.value = data.data
      // Expand all projects by default
      expandedProjects.value = data.data.projects.map(p => p.projectId)
      notificationsStore.success('Tasks loaded successfully')
    } else {
      throw new Error(data.message || 'Failed to fetch tasks')
    }
  } catch (error) {
    console.error('Error fetching user tasks:', error)
    notificationsStore.error(error.message || 'Failed to load your tasks')
  } finally {
    loading.value = false
  }
}

// Computed properties
const filteredProjects = computed(() => {
  if (!userTasksData.value?.projects) return []
  
  let projects = userTasksData.value.projects
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    projects = projects.filter(project => 
      project.projectName.toLowerCase().includes(query) ||
      project.tasks.some(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.issueKey?.toLowerCase().includes(query)
      )
    )
    
    // Also filter tasks within projects
    projects = projects.map(project => ({
      ...project,
      tasks: project.tasks.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.issueKey?.toLowerCase().includes(query)
      )
    }))
  }
  
  return projects
})

const allTasks = computed(() => {
  if (!userTasksData.value?.projects) return []
  return userTasksData.value.projects.flatMap(project => 
    project.tasks.map(task => ({
      ...task,
      projectId: project.projectId,
      projectName: project.projectName
    }))
  )
})

const kanbanColumns = computed(() => {
  const tasks = allTasks.value
  return {
    todo: tasks.filter(task => ['To Do', 'Open', 'New'].includes(task.status)),
    inProgress: tasks.filter(task => ['In Progress', 'In Development', 'In Review'].includes(task.status)),
    done: tasks.filter(task => ['Done', 'Closed', 'Resolved', 'Completed'].includes(task.status)),
    blocked: tasks.filter(task => ['Blocked', 'Impediment'].includes(task.status))
  }
})

// Helper functions
const getProgressWidth = (type) => {
  if (!userTasksData.value?.stats?.totalTasks) return 0
  const total = userTasksData.value.stats.totalTasks
  let count = 0
  
  switch (type) {
    case 'inProgress':
      count = userTasksData.value.stats.inProgressTasks || 0
      break
    case 'completed':
      count = userTasksData.value.stats.completedTasks || 0
      break
    case 'overdue':
      count = userTasksData.value.stats.overdueTasks || 0
      break
  }
  
  return total > 0 ? (count / total) * 100 : 0
}

const toggleProjectExpansion = (projectId) => {
  const index = expandedProjects.value.indexOf(projectId)
  if (index > -1) {
    expandedProjects.value.splice(index, 1)
  } else {
    expandedProjects.value.push(projectId)
  }
}

const getProjectTasksByStatus = (project, status) => {
  return project.tasks.filter(task => task.status === status)
}

const getProjectOverdueTasks = (project) => {
  return project.tasks.filter(task => isTaskOverdue(task))
}

const isTaskCompleted = (task) => {
  return ['Done', 'Closed', 'Resolved', 'Completed'].includes(task.status)
}

const isTaskOverdue = (task) => {
  if (!task.dueDate || isTaskCompleted(task)) return false
  return new Date(task.dueDate) < new Date()
}

const stripHtml = (html) => {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return formatDate(dateStr)
}

const getProjectName = (projectId) => {
  const project = userTasksData.value?.projects?.find(p => p.projectId === projectId)
  return project?.projectName || 'Unknown Project'
}

const getStatusBadgeClass = (status) => {
  if (['Done', 'Closed', 'Resolved', 'Completed'].includes(status)) {
    return 'bg-success-100 text-success-800'
  } else if (['In Progress', 'In Development', 'In Review'].includes(status)) {
    return 'bg-orange-100 text-orange-800'
  } else if (['Blocked', 'Impediment'].includes(status)) {
    return 'bg-error-100 text-error-800'
  } else {
    return 'bg-blue-100 text-blue-800'
  }
}

const getPriorityBadgeClass = (priority) => {
  const priorityLower = priority?.toLowerCase() || ''
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

// Actions
const toggleTaskStatus = async (task) => {
  // In a real implementation, you'd call JIRA API to update the task status
  notificationsStore.info(`Task status update for JIRA issue ${task.issueKey} would be synced to JIRA`)
}

const openInJira = (jiraUrl) => {
  window.open(jiraUrl, '_blank')
}

const viewTaskDetails = (task) => {
  // Could open a modal or navigate to task details
  notificationsStore.info(`Viewing details for: ${task.title}`)
}

// Initialize
onMounted(() => {
  fetchUserTasks()
})
</script>

<style scoped>
.shadow-card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  line-clamp: 1;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}

/* Animation for hover effects */
.transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

.hover\:-translate-y-1:hover {
  --tw-translate-y: -0.25rem;
  transform: var(--tw-transform);
}
</style>