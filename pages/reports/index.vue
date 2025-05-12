```vue
<template>
  <div class="relative">
    <!-- Loading overlay -->
    <div v-if="isLoading" class="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
      <div class="flex flex-col items-center">
        <svg class="animate-spin h-12 w-12 text-primary-600" xmlns="http ills://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-3 text-neutral-700 font-medium">Loading reports...</p>
      </div>
    </div>

    <!-- Header with search and action buttons -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div class="flex flex-col w-full md:w-auto mb-4 md:mb-0">
        <h1 class="text-3xl font-bold text-neutral-900 mb-2">Reports Dashboard</h1>
        <p class="text-neutral-600">View and analyze project performance metrics</p>
      </div>
      
      <div class="flex flex-col sm:flex-row w-full md:w-auto gap-4">
        <div class="relative">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search projects..." 
            class="pl-10 pr-4 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="text-neutral-500 sm:text-sm">
              <span class="mdi mdi-magnify"></span>
            </span>
          </div>
        </div>

        <div class="dropdown relative">
          <button 
            @click="isExportMenuOpen = !isExportMenuOpen"
            class="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-300"
          >
            <span v-if="isExporting" class="mdi mdi-loading mdi-spin text-lg mr-2"></span>
            <span v-else class="mdi mdi-file-export text-lg mr-2"></span>
            Export
            <span class="mdi mdi-chevron-down ml-2"></span>
          </button>
          
          <div v-if="isExportMenuOpen" class="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10">
            <div class="p-2">
              <button 
                @click="exportReports('pdf')" 
                class="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded flex items-center"
              >
                <span class="mdi mdi-file-pdf-box text-error-600 mr-2"></span>
                Export as PDF
              </button>
              <button 
                @click="exportReports('excel')" 
                class="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded flex items-center"
              >
                <span class="mdi mdi-file-excel-box text-success-600 mr-2"></span>
                Export as Excel
              </button>
              <button 
                @click="exportReports('csv')" 
                class="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded flex items-center"
              >
                <span class="mdi mdi-file-delimited text-warning-600 mr-2"></span>
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Advanced filters -->
    <div class="mb-8 bg-white p-5 rounded-xl shadow-card">
      <h2 class="text-lg font-medium text-neutral-800 mb-4 flex items-center">
        <span class="mdi mdi-filter-variant text-primary-600 mr-2"></span>
        Advanced Filters
      </h2>
      <div class="flex flex-wrap gap-4">
        <div class="relative">
          <select 
            v-model="filters.dateRange" 
            class="pl-10 pr-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="mdi mdi-calendar-range text-neutral-500"></span>
          </div>
        </div>
        
        <div class="relative">
          <select 
            v-model="filters.department" 
            class="pl-10 pr-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="all">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
          </select>
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="mdi mdi-office-building text-neutral-500"></span>
          </div>
        </div>
        
        <div class="w-64">
          <UserSelect
            v-model="filters.teamMember"
            placeholder="All Team Members"
            label="Team Member"
          />
        </div>
        
        <button 
          @click="applyFilters" 
          class="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Apply Filters
        </button>
        
        <button 
          @click="toggleAutoRefresh" 
          class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border"
          :class="autoRefresh ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-neutral-300 text-neutral-700'"
        >
          <span :class="['mdi mr-2', autoRefresh ? 'mdi-sync text-primary-600' : 'mdi-sync-off text-neutral-500']"></span>
          {{ autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off' }}
        </button>
      </div>
    </div>
    
    <!-- Key Performance Indicators Section -->
    <div class="bg-white rounded-xl shadow-card mb-8 p-5">
      <h2 class="text-xl font-semibold text-neutral-800 mb-4 flex items-center">
        <span class="mdi mdi-chart-areaspline text-primary-600 mr-2"></span>
        Key Performance Indicators
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- On-time Delivery Rate -->
        <div class="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-sm font-medium text-neutral-600">On-time Delivery Rate</h3>
            <span class="mdi mdi-information-outline text-neutral-400 cursor-help" title="Percentage of projects completed before deadline"></span>
          </div>
          <div class="text-2xl font-bold text-neutral-900 mb-2">{{ onTimeDeliveryRate }}%</div>
          <div class="w-full bg-neutral-200 rounded-full h-2">
            <div class="bg-success-600 h-2 rounded-full" :style="`width: ${onTimeDeliveryRate}%`"></div>
          </div>
          <div class="text-xs text-neutral-500 mt-1">Target: 90%</div>
        </div>
        
        <!-- Resource Utilization -->
        <div class="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-sm font-medium text-neutral-600">Resource Utilization</h3>
            <span class="mdi mdi-information-outline text-neutral-400 cursor-help" title="Percentage of team members assigned to at least one project"></span>
          </div>
          <div class="text-2xl font-bold text-neutral-900 mb-2">{{ resourceUtilization }}%</div>
          <div class="w-full bg-neutral-200 rounded-full h-2">
            <div 
              :class="[
                'h-2 rounded-full',
                resourceUtilization >= 80 ? 'bg-success-600' : resourceUtilization >= 60 ? 'bg-accent-600' : 'bg-warning-600'
              ]" 
              :style="`width: ${resourceUtilization}%`"
            ></div>
          </div>
          <div class="text-xs text-neutral-500 mt-1">Target: 85%</div>
        </div>
        
        <!-- Project Health Index -->
        <div class="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-sm font-medium text-neutral-600">Project Health Index</h3>
            <span class="mdi mdi-information-outline text-neutral-400 cursor-help" title="Overall health of projects based on progress and deadlines"></span>
          </div>
          <div class="text-2xl font-bold text-neutral-900 mb-2">{{ projectHealthIndex }}%</div>
          <div class="w-full bg-neutral-200 rounded-full h-2">
            <div 
              :class="[
                'h-2 rounded-full',
                projectHealthIndex >= 75 ? 'bg-success-600' : projectHealthIndex >= 50 ? 'bg-accent-600' : 'bg-warning-600'
              ]" 
              :style="`width: ${projectHealthIndex}%`"
            ></div>
          </div>
          <div class="text-xs text-neutral-500 mt-1">Target: 80%</div>
        </div>
      </div>
    </div>
    
    <!-- Stats Cards Row with animation -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Projects -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
            <span class="mdi mdi-folder-multiple text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Total Projects</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ totalProjects }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-information-outline mr-1"></span>
            All time projects
          </span>
        </div>
      </div>
      
      <!-- Ongoing Projects -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center text-accent-600">
            <span class="mdi mdi-clock-outline text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Ongoing</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ ongoingCount }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-chart-line mr-1"></span>
            Avg. Progress: {{ averageProgress }}%
          </span>
        </div>
      </div>
      
      <!-- Completed Projects -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center text-success-600">
            <span class="mdi mdi-check-circle-outline text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Completed</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ completedCount }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-percent mr-1"></span>
            {{ completionPercentage }}% completion rate
          </span>
        </div>
      </div>
      
      <!-- Projects at Risk -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
            <span class="mdi mdi-alert-circle-outline text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">At Risk</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ atRiskCount }}</p>
        <div class="mt-3 flex items-center text-sm text-neutral-600">
          <span class="flex items-center">
            <span class="mdi mdi-alert-outline mr-1"></span>
            Requires attention
          </span>
        </div>
      </div>
    </div>
    
    <!-- Analytics Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Project Status Distribution -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300">
        <h3 class="text-lg font-semibold text-neutral-800 mb-4">Project Status Distribution</h3>
        <div class="h-64">
          <canvas id="statusChart"></canvas>
        </div>
      </div>
      
      <!-- Progress Over Time -->
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300">
        <h3 class="text-lg font-semibold text-neutral-800 mb-4">Progress Over Time</h3>
        <div class="h-64">
          <canvas id="progressChart"></canvas>
        </div>
      </div>
    </div>
    
    <!-- Resource Utilization Section -->
    <div class="bg-white rounded-xl shadow-card mb-8 overflow-hidden">
      <div class="border-b border-neutral-200 p-5">
        <h2 class="text-xl font-semibold text-neutral-800 flex items-center">
          <span class="mdi mdi-account-multiple text-primary-600 mr-2"></span>
          Resource Utilization
        </h2>
      </div>
      <div class="p-5">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Team Workload Distribution -->
          <div>
            <h3 class="text-md font-medium text-neutral-700 mb-4">Team Workload Distribution</h3>
            <div class="h-80">
              <canvas id="workloadChart"></canvas>
            </div>
          </div>
          
          <!-- Top Contributors -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-md font-medium text-neutral-700">Top Contributors</h3>
              <div class="text-sm text-neutral-500">Based on active projects</div>
            </div>
            <div class="space-y-4">
              <div v-for="(member, index) in topContributors" :key="member.id" class="bg-neutral-50 p-3 rounded-lg">
                <div class="flex items-center mb-2">
                  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <span class="mdi mdi-account text-primary-600"></span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex justify-between">
                      <p class="text-sm font-medium text-neutral-900">
                        {{ member.name }}
                      </p>
                      <p class="text-sm text-neutral-500">
                        {{ member.role }}
                      </p>
                    </div>
                    <div class="flex items-center mt-1">
                      <div class="flex-1">
                        <div class="h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div class="h-full bg-primary-600 rounded-full" :style="`width: ${member.utilizationRate}%`"></div>
                        </div>
                      </div>
                      <span class="ml-2 flex-shrink-0 text-xs font-medium text-neutral-700">{{ member.utilizationRate }}%</span>
                    </div>
                  </div>
                </div>
                <div class="ml-13 pl-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span class="text-neutral-500">Assigned:</span>
                    <span class="font-medium text-neutral-700 ml-1">{{ member.assignedProjects }}</span>
                  </div>
                  <div>
                    <span class="text-neutral-500">Completed:</span>
                    <span class="font-medium text-neutral-700 ml-1">{{ member.completedProjects }}</span>
                  </div>
                  <div>
                    <span class="text-neutral-500">On-time:</span>
                    <span class="font-medium text-neutral-700 ml-1">{{ member.onTimeRate }}%</span>
                  </div>
                </div>
              </div>
              <div v-if="topContributors.length === 0" class="text-center py-8 text-sm text-neutral-500">
                <div class="flex flex-col items-center">
                  <span class="mdi mdi-account-multiple-outline text-4xl text-neutral-400 mb-2"></span>
                  No team data available
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Department Project Distribution -->
        <div class="mt-6">
          <h3 class="text-md font-medium text-neutral-700 mb-4">Department Project Distribution</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-center">
              <h4 class="text-sm font-medium text-neutral-600 mb-2">Engineering</h4>
              <p class="text-2xl font-bold text-neutral-900">{{ departmentCounts.engineering || 0 }}</p>
              <div class="text-xs text-neutral-500 mt-1">{{ calculateDepartmentPercentage('engineering') }}% of projects</div>
            </div>
            <div class="bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-center">
              <h4 class="text-sm font-medium text-neutral-600 mb-2">Design</h4>
              <p class="text-2xl font-bold text-neutral-900">{{ departmentCounts.design || 0 }}</p>
              <div class="text-xs text-neutral-500 mt-1">{{ calculateDepartmentPercentage('design') }}% of projects</div>
            </div>
            <div class="bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-center">
              <h4 class="text-sm font-medium text-neutral-600 mb-2">Marketing</h4>
              <p class="text-2xl font-bold text-neutral-900">{{ departmentCounts.marketing || 0 }}</p>
              <div class="text-xs text-neutral-500 mt-1">{{ calculateDepartmentPercentage('marketing') }}% of projects</div>
            </div>
            <div class="bg-neutral-50 p-4 rounded-lg border border-neutral-200 text-center">
              <h4 class="text-sm font-medium text-neutral-600 mb-2">Sales</h4>
              <p class="text-2xl font-bold text-neutral-900">{{ departmentCounts.sales || 0 }}</p>
              <div class="text-xs text-neutral-500 mt-1">{{ calculateDepartmentPercentage('sales') }}% of projects</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Team Performance Section -->
    <div class="bg-white rounded-xl shadow-card mb-8 overflow-hidden">
      <div class="border-b border-neutral-200 p-5">
        <h2 class="text-xl font-semibold text-neutral-800">Team Performance</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Team Member
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Assigned Projects
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Completed Projects
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Average Progress
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                On-time Completion
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            <tr v-if="teamPerformance.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-sm text-neutral-500">
                <div class="flex flex-col items-center">
                  <span class="mdi mdi-account-group-outline text-4xl text-neutral-400 mb-2"></span>
                  No team performance data available.
                </div>
              </td>
            </tr>
            <tr v-for="member in teamPerformance" :key="member.id" class="hover:bg-neutral-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <span class="mdi mdi-account text-lg"></span>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-neutral-900">{{ member.name }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {{ member.role }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {{ member.assignedProjects }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                {{ member.completedProjects }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-full bg-neutral-200 rounded-full h-2 mr-2 max-w-[100px]">
                    <div 
                      :class="[
                        'h-2 rounded-full',
                        member.avgProgress >= 80 ? 'bg-success-600' : 
                        member.avgProgress >= 40 ? 'bg-accent-600' : 'bg-warning-600'
                      ]"
                      :style="`width: ${member.avgProgress}%`"
                    ></div>
                  </div>
                  <span class="text-xs font-medium text-neutral-700">{{ member.avgProgress }}%</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-full bg-neutral-200 rounded-full h-2 mr-2 max-w-[100px]">
                    <div 
                      :class="[
                        'h-2 rounded-full',
                        member.onTimeRate >= 80 ? 'bg-success-600' : 
                        member.onTimeRate >= 50 ? 'bg-accent-600' : 'bg-warning-600'
                      ]"
                      :style="`width: ${member.onTimeRate}%`"
                    ></div>
                  </div>
                  <span class="text-xs font-medium text-neutral-700">{{ member.onTimeRate }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Project Risk Assessment Dashboard -->
    <div class="bg-white rounded-xl shadow-card mb-8 overflow-hidden">
      <div class="border-b border-neutral-200 p-5">
        <h2 class="text-xl font-semibold text-neutral-800 flex items-center">
          <span class="mdi mdi-alert-circle text-error-600 mr-2"></span>
          Project Risk Assessment
        </h2>
      </div>
      <div class="p-5">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- High Risk -->
          <div class="bg-error-50 p-4 rounded-lg border border-error-200">
            <h3 class="text-md font-semibold text-error-800 mb-2 flex items-center">
              <span class="mdi mdi-alert-circle text-error-600 mr-2"></span>
              High Risk ({{ highRiskProjects.length }})
            </h3>
            <ul class="space-y-2 max-h-[200px] overflow-y-auto">
              <li v-for="project in highRiskProjects" :key="project.id" class="text-sm">
                <div class="flex items-center">
                  <span class="w-2 h-2 bg-error-600 rounded-full mr-2"></span>
                  <span class="truncate">{{ project.name }}</span>
                </div>
                <div class="pl-4 text-xs text-error-700 flex items-center">
                  <span class="mdi mdi-calendar-alert mr-1"></span>
                  {{ project.daysToDeadline < 0 ? Math.abs(project.daysToDeadline) + ' days overdue' : project.daysToDeadline + ' days remaining' }}
                  <span class="mx-1 text-neutral-300">|</span>
                  <span class="mdi mdi-chart-line mr-1"></span>
                  {{ project.progress }}% complete
                </div>
              </li>
              <li v-if="highRiskProjects.length === 0" class="text-sm italic text-neutral-500 py-2">
                No high risk projects
              </li>
            </ul>
          </div>
          
          <!-- Medium Risk -->
          <div class="bg-warning-50 p-4 rounded-lg border border-warning-200">
            <h3 class="text-md font-semibold text-warning-800 mb-2 flex items-center">
              <span class="mdi mdi-alert text-warning-600 mr-2"></span>
              Medium Risk ({{ mediumRiskProjects.length }})
            </h3>
            <ul class="space-y-2 max-h-[200px] overflow-y-auto">
              <li v-for="project in mediumRiskProjects" :key="project.id" class="text-sm">
                <div class="flex items-center">
                  <span class="w-2 h-2 bg-warning-600 rounded-full mr-2"></span>
                  <span class="truncate">{{ project.name }}</span>
                </div>
                <div class="pl-4 text-xs text-warning-700 flex items-center">
                  <span class="mdi mdi-calendar-clock mr-1"></span>
                  {{ project.daysToDeadline }} days remaining
                  <span class="mx-1 text-neutral-300">|</span>
                  <span class="mdi mdi-chart-line mr-1"></span>
                  {{ project.progress }}% complete
                </div>
              </li>
              <li v-if="mediumRiskProjects.length === 0" class="text-sm italic text-neutral-500 py-2">
                No medium risk projects
              </li>
            </ul>
          </div>
          
          <!-- Low Risk -->
          <div class="bg-success-50 p-4 rounded-lg border border-success-200">
            <h3 class="text-md font-semibold text-success-800 mb-2 flex items-center">
              <span class="mdi mdi-check-circle text-success-600 mr-2"></span>
              Low Risk ({{ lowRiskProjects.length }})
            </h3>
            <ul class="space-y-2 max-h-[200px] overflow-y-auto">
              <li v-for="project in lowRiskProjects.slice(0, 5)" :key="project.id" class="text-sm">
                <div class="flex items-center">
                  <span class="w-2 h-2 bg-success-600 rounded-full mr-2"></span>
                  <span class="truncate">{{ project.name }}</span>
                </div>
                <div class="pl-4 text-xs text-success-700 flex items-center">
                  <span class="mdi mdi-calendar-check mr-1"></span>
                  {{ project.daysToDeadline }} days remaining
                  <span class="mx-1 text-neutral-300">|</span>
                  <span class="mdi mdi-chart-line mr-1"></span>
                  {{ project.progress }}% complete
                </div>
              </li>
              <li v-if="lowRiskProjects.length > 5" class="text-xs text-success-700 mt-2 italic">
                + {{ lowRiskProjects.length - 5 }} more projects
              </li>
              <li v-if="lowRiskProjects.length === 0" class="text-sm italic text-neutral-500 py-2">
                No low risk projects
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Risk Timeline -->
        <div class="mt-6">
          <h3 class="text-md font-medium text-neutral-700 mb-3">Risk Timeline</h3>
          <div class="relative h-20 bg-neutral-50 rounded-lg overflow-hidden">
            <!-- Timeline marker lines -->
            <div class="absolute inset-0 flex">
              <div class="flex-1 border-r border-dashed border-neutral-200"></div>
              <div class="flex-1 border-r border-dashed border-neutral-200"></div>
              <div class="flex-1 border-r border-dashed border-neutral-200"></div>
              <div class="flex-1"></div>
            </div>
            
            <!-- Timeline labels -->
            <div class="absolute bottom-1 left-0 right-0 flex text-xs text-neutral-500">
              <div class="flex-1 text-center">Overdue</div>
              <div class="flex-1 text-center">1 Week</div>
              <div class="flex-1 text-center">2 Weeks</div>
              <div class="flex-1 text-center">Safe</div>
            </div>
            
            <!-- Projects markers -->
            <div v-for="project in projectsWithDeadlines" :key="project.id" 
                 class="absolute w-3 h-3 rounded-full cursor-pointer"
                 :class="getProjectMarkerClass(project)"
                 :style="getProjectMarkerPosition(project)"
                 :title="project.name + ' - ' + (project.daysToDeadline < 0 ? Math.abs(project.daysToDeadline) + ' days overdue' : project.daysToDeadline + ' days remaining')">
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Projects Section with Tabs -->
    <div class="bg-white rounded-xl shadow-card mb-8 overflow-hidden">
      <div class="border-b border-neutral-200 p-5">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-neutral-800">Projects Overview</h2>
          <a href="/projects" class="text-primary-600 hover:text-primary-700 text-sm flex items-center">
            View all
            <span class="mdi mdi-chevron-right ml-1"></span>
          </a>
        </div>
        
        <!-- Tabs Navigation -->
        <div class="flex mt-4 border-b border-neutral-200">
          <button 
            @click="selectedTab = 'all'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'all' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            All Projects ({{ totalProjects }})
          </button>
          <button 
            @click="selectedTab = 'ongoing'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'ongoing' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            Ongoing ({{ ongoingCount }})
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
            Completed ({{ completedCount }})
          </button>
          <button 
            @click="selectedTab = 'onhold'" 
            :class="[
              'px-4 py-2 text-sh font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'onhold' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            On Hold ({{ onHoldCount }})
          </button>
          <button 
            @click="selectedTab = 'atrisk'" 
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-200',
              selectedTab === 'atrisk' 
                ? 'border-primary-600 text-primary-600' 
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            ]"
          >
            At Risk ({{ atRiskCount }})
          </button>
        </div>
      </div>
      
      <!-- Projects Table -->
      <div class="p-5">
        <div class="grid grid-cols-1 gap-4">
          <div 
            v-for="project in filteredProjects" 
            :key="project.id" 
            class="bg-white rounded-lg shadow-card p-4 hover:shadow-xl transition-shadow duration-300"
          >
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-semibold text-neutral-800 mb-1">{{ project.name }}</h3>
                <div class="flex flex-wrap gap-2">
                  <span class="text-xs rounded-full" :class="getStatusColorClass(project.status)">
                    {{ project.status }}
                  </span>
                  <span class="text-xs rounded-full bg-neutral-100 text-neutral-700">
                    {{ project.department }}
                  </span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-neutral-500">
                  <span class="mdi mdi-calendar text-neutral-400 mr-1"></span>
                  {{ new Date(project.startDate).toLocaleDateString() }} - 
                  <span class="mdi mdi-calendar text-neutral-400 mr-1 ml-2"></span>
                  {{ new Date(project.endDate).toLocaleDateString() }}
                </div>
                <div class="text-sm text-neutral-500">
                  <span class="mdi mdi-clock-outline text-neutral-400 mr-1"></span>
                  {{ project.daysToDeadline }} days to deadline
                </div>
              </div>
            </div>
            
            <div class="mb-4">
              <div class="text-sm text-neutral-600 mb-1">Progress</div>
              <div class="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  class="bg-primary-600 h-2.5 rounded-full transition-all duration-1000" 
                  :style="`width: ${project.progress}%`"
                ></div>
              </div>
            </div>
            
            <div class="text-sm text-neutral-600">
              <div class="flex items-center mb-2">
                <span class="mdi mdi-account text-lg mr-2 text-neutral-500"></span>
                <span class="truncate">{{ getUserName(project.assignedTo) }}</span>
              </div>
              <div class="flex items-center mb-2">
                <span class="mdi mdi-calendar text-lg mr-2 text-neutral-500"></span>
                <span class="truncate">{{ project.startDate || 'N/A' }} - {{ project.endDate || 'N/A' }}</span>
              </div>
              <div class="flex items-center">
                <span :class="['mdi mr-2 text-lg text-neutral-500', project.daysToDeadline < 0 ? 'mdi-alert-circle' : 'mdi-clock-outline']"></span>
                <span class="truncate" :class="getDaysToDeadlineClass(project.daysToDeadline)">
                  {{ project.daysToDeadline === 'N/A' ? 'No deadline set' : 
                    project.daysToDeadline < 0 ? Math.abs(project.daysToDeadline) + ' days overdue' : 
                    project.daysToDeadline + ' days remaining' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-neutral-50 px-6 py-3 border-t border-neutral-200 text-sm text-neutral-500">
        Showing {{ filteredProjects.length }} of {{ projects.length }} projects
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { useUsersStore } from '~/stores/users';
import { useProjectsStore } from '~/stores/projects';
import { useNotificationsStore } from '~/stores/notifications';
import { Chart, registerables } from 'chart.js';
import UserSelect from '~/components/common/UserSelect.vue';

// Register Chart.js components
Chart.register(...registerables);

// Define layout
definePageMeta({
  layout: 'dashboard'
});

// Stores
const usersStore = useUsersStore();
const projectsStore = useProjectsStore();
const notificationsStore = useNotificationsStore();

// UI State
const isLoading = ref(true);
const selectedTab = ref('all');
const searchQuery = ref('');
const isExporting = ref(false);
const isExportMenuOpen = ref(false);
const autoRefresh = ref(false);

// Data
const projects = ref([]);
const users = ref([]);

// Filter states
const filters = ref({
  dateRange: '30',
  status: 'all',
  teamMember: 'all',
  department: 'all'
});

// Computed properties
const totalProjects = computed(() => projects.value.length);
const completedProjects = computed(() => projects.value.filter(p => p.status === 'Completed'));
const ongoingProjects = computed(() => projects.value.filter(p => p.status === 'Ongoing'));
const onHoldProjects = computed(() => projects.value.filter(p => p.status === 'On Hold'));

const completedCount = computed(() => completedProjects.value.length);
const ongoingCount = computed(() => ongoingProjects.value.length);
const onHoldCount = computed(() => onHoldProjects.value.length);

// Calculate metrics
const completionPercentage = computed(() => {
  return Math.round((completedCount.value / totalProjects.value) * 100) || 0;
});

const averageProgress = computed(() => {
  if (ongoingProjects.value.length === 0) return 0;
  const total = ongoingProjects.value.reduce((acc, project) => acc + project.progress, 0);
  return Math.round(total / ongoingProjects.value.length);
});

// Calculate projects at risk
const projectsAtRisk = computed(() => {
  const now = new Date();
  return projects.value.filter(p => {
    if (p.status === 'Completed') return false;
    if (!p.endDate) return false;
    const deadline = new Date(p.endDate);
    const daysToDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    return (daysToDeadline < 0) || 
           (daysToDeadline < 7 && p.progress < 80);
  });
});

const atRiskCount = computed(() => projectsAtRisk.value.length);

const filteredProjects = computed(() => {
  let result = projects.value;
  
  // Apply status filter based on selected tab
  if (selectedTab.value !== 'all') {
    switch(selectedTab.value) {
      case 'ongoing':
        result = ongoingProjects.value;
        break;
      case 'completed':
        result = completedProjects.value;
        break;
      case 'onhold':
        result = onHoldProjects.value;
        break;
      case 'atrisk':
        result = projectsAtRisk.value;
        break;
    }
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) ||
      (p.assignedTo && getUserName(p.assignedTo).toLowerCase().includes(query))
    );
  }
  
  // Apply date range filter
  const now = new Date();
  if (filters.value.dateRange !== 'all') {
    const days = parseInt(filters.value.dateRange);
    const cutoffDate = new Date(now.setDate(now.getDate() - days));
    result = result.filter(p => {
      const projectDate = new Date(p.startDate);
      return projectDate >= cutoffDate;
    });
  }
  
  // Apply department filter
  if (filters.value.department !== 'all') {
    result = result.filter(p => p.department === filters.value.department);
  }
  
  // Apply team member filter
  if (filters.value.teamMember !== 'all') {
    result = result.filter(p => p.assignedTo === filters.value.teamMember);
  }
  
  return result.map(project => {
    // Calculate days to deadline
    const daysToDeadline = project.endDate ? 
      Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
    
    // Calculate risk level based on progress and days to deadline
    let riskLevel = 'Low';
    if (project.status !== 'Completed') {
      if (daysToDeadline !== null) {
        if (daysToDeadline < 0) {
          riskLevel = 'Overdue';
        } else if (daysToDeadline < 7 && project.progress < 80) {
          riskLevel = 'High';
        } else if (daysToDeadline < 14 && project.progress < 60) {
          riskLevel = 'Medium';
        }
      }
    }
    
    return {
      ...project,
      daysToDeadline: daysToDeadline !== null ? daysToDeadline : 'N/A',
      riskLevel
    };
  });
});

// Team performance data
const teamPerformance = ref([]);
const refreshInterval = ref(null);

// KPI Computed Properties
const onTimeDeliveryRate = computed(() => {
  const completedWithDeadlines = completedProjects.value.filter(p => p.endDate);
  if (completedWithDeadlines.length === 0) return 0;
  
  let onTimeCount = 0;
  completedWithDeadlines.forEach(p => {
    if (!p.lastUpdated) {
      onTimeCount++;
    } else {
      const completedDate = new Date(p.lastUpdated);
      const deadlineDate = new Date(p.endDate);
      if (completedDate <= deadlineDate) {
        onTimeCount++;
      }
    }
  });
  
  return Math.round((onTimeCount / completedWithDeadlines.length) * 100);
});

const resourceUtilization = computed(() => {
  if (users.value.length === 0) return 0;
  
  const usersWithProjects = users.value.filter(user => {
    return projects.value.some(p => {
      const isAssigned = p.assignedTo === user.id || p.assignedTo === user._id;
      const isTeamMember = p.team && Array.isArray(p.team) && 
                          (p.team.includes(user.id) || p.team.includes(user._id));
      const isDeveloper = p.developers && Array.isArray(p.developers) && 
                         (p.developers.includes(user.id) || p.developers.includes(user._id));
      const isResponsible = p.responsiblePerson === user.id || p.responsiblePerson === user._id;
      return isAssigned || isTeamMember || isDeveloper || isResponsible;
    });
  });
  
  return Math.round((usersWithProjects.length / users.value.length) * 100);
});

const projectHealthIndex = computed(() => {
  if (projects.value.length === 0) return 0;
  
  // Calculate health score based on multiple factors
  let totalScore = 0;
  
  projects.value.forEach(p => {
    let projectScore = 0;
    
    // Factor 1: Progress relative to timeline
    if (p.startDate && p.endDate && p.progress) {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      const now = new Date();
      const totalDuration = end - start;
      
      if (totalDuration > 0) {
        const elapsedDuration = now - start;
        const expectedProgress = Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));
        
        // Compare actual progress to expected progress
        const progressScore = p.status === 'Completed' ? 100 : 
          p.progress >= expectedProgress ? 100 : Math.round((p.progress / expectedProgress) * 100);
        projectScore += progressScore;
      }
    }
    
    // Factor 2: Risk level
    if (p.status === 'Completed') {
      projectScore += 100;
    } else {
      const daysToDeadline = p.endDate ? 
        Math.ceil((new Date(p.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
        
      if (daysToDeadline !== null) {
        if (daysToDeadline < 0) {
          projectScore += 0; // Overdue
        } else if (daysToDeadline < 7 && p.progress < 80) {
          projectScore += 30; // High risk
        } else if (daysToDeadline < 14 && p.progress < 60) {
          projectScore += 60; // Medium risk
        } else {
          projectScore += 90; // Low risk
        }
      } else {
        projectScore += 50; // No deadline
      }
    }
    
    // Average the factors
    totalScore += (projectScore / 2);
  });
  
  return Math.round(totalScore / projects.value.length);
});

// Risk assessment computed properties
const highRiskProjects = computed(() => {
  return filteredProjects.value.filter(p => 
    p.status !== 'Completed' && 
    (p.riskLevel === 'High' || p.riskLevel === 'Overdue')
  );
});

const mediumRiskProjects = computed(() => {
  return filteredProjects.value.filter(p => 
    p.status !== 'Completed' && 
    p.riskLevel === 'Medium'
  );
});

const lowRiskProjects = computed(() => {
  return filteredProjects.value.filter(p => 
    p.status !== 'Completed' && 
    p.riskLevel === 'Low'
  );
});

const projectsWithDeadlines = computed(() => {
  return filteredProjects.value.filter(p => 
    p.status !== 'Completed' && 
    p.daysToDeadline !== 'N/A'
  );
});

// Department counts and top contributors data
const departmentCounts = computed(() => {
  const counts = {
    engineering: 0,
    design: 0,
    marketing: 0,
    sales: 0
  };
  
  projects.value.forEach(project => {
    const department = project.category?.toLowerCase();
    if (department === 'development') {
      counts.engineering++;
    } else if (department === 'design') {
      counts.design++;
    } else if (department === 'marketing') {
      counts.marketing++;
    } else if (department === 'support') {
      counts.sales++;
    }
  });
  
  return counts;
});

const calculateDepartmentPercentage = (department) => {
  if (!projects.value.length) return 0;
  return Math.round((departmentCounts.value[department] / projects.value.length) * 100);
};

const topContributors = computed(() => {
  if (!teamPerformance.value.length) return [];
  
  // Sort by a combined score of assigned projects and completion rate
  return [...teamPerformance.value]
    .sort((a, b) => {
      const scoreA = a.assignedProjects * 2 + a.completedProjects * 3 + (a.onTimeRate / 10);
      const scoreB = b.assignedProjects * 2 + b.completedProjects * 3 + (b.onTimeRate / 10);
      return scoreB - scoreA;
    })
    .slice(0, 5)
    .map(member => ({
      ...member,
      utilizationRate: Math.min(100, Math.round((member.assignedProjects / (totalProjects.value / users.value.length * 2)) * 100))
    }));
});

// Methods
const applyFilters = () => {
  notificationsStore.success('Filters applied successfully');
};

// Export reports function to handle different formats
const exportReports = async (format = 'pdf') => {
  isExporting.value = true;
  isExportMenuOpen.value = false;
  
  try {
    // Logic for exporting reports in different formats
    switch(format) {
      case 'pdf':
        notificationsStore.info('Preparing PDF export...', { timeout: 2000 });
        await exportToPDF();
        break;
      case 'excel':
        notificationsStore.info('Preparing Excel export...', { timeout: 2000 });
        await exportToExcel();
        break;
      case 'csv':
        notificationsStore.info('Preparing CSV export...', { timeout: 2000 });
        await exportToCSV();
        break;
      default:
        throw new Error('Unsupported export format');
    }
    
    notificationsStore.success(`Reports exported successfully as ${format.toUpperCase()}`);
  } catch (error) {
    console.error('Error exporting reports:', error);
    notificationsStore.error('Failed to export reports');
  } finally {
    isExporting.value = false;
  }
};

// Export to PDF
const exportToPDF = async () => {
  // Simulate PDF export (would use jsPDF or similar in real implementation)
  await new Promise(resolve => setTimeout(resolve, 1000));
  // PDF export logic would go here
};

// Export to Excel
const exportToExcel = async () => {
  // Simulate Excel export
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Excel export logic would go here
};

// Export to CSV
const exportToCSV = async () => {
  // Simulate CSV export
  await new Promise(resolve => setTimeout(resolve, 1000));
  // CSV export logic would go here
};

// Toggle auto-refresh functionality
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  
  if (autoRefresh.value) {
    refreshInterval.value = setInterval(async () => {
      await fetchProjects();
      await fetchUsers();
      calculateTeamPerformance();
      initializeCharts();
      notificationsStore.info('Dashboard data refreshed', { timeout: 2000 });
    }, 60000); // Refresh every minute
  } else {
    clearInterval(refreshInterval.value);
  }
};

// Clean up on component unmount
onBeforeUnmount(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});

const getUserName = (userId) => {
  const user = users.value.find(u => u._id === userId);
  return user ? user.name : 'Unknown User';
};

const getStatusColorClass = (status) => {
  switch (status) {
    case 'Ongoing': return 'bg-accent-100 text-accent-700';
    case 'Completed': return 'bg-success-100 text-success-800';
    case 'On Hold': return 'bg-warning-100 text-warning-700';
    default: return 'bg-neutral-100 text-neutral-700';
  }
};

const getDaysToDeadlineClass = (days) => {
  if (days === 'N/A') return 'text-neutral-500';
  if (days < 0) return 'text-error-600 font-medium';
  if (days < 7) return 'text-warning-600 font-medium';
  if (days < 14) return 'text-accent-600';
  return 'text-success-600';
};

const getRiskClass = (risk) => {
  switch (risk.toLowerCase()) {
    case 'high':
      return 'bg-error-100 text-error-800';
    case 'medium':
      return 'bg-warning-100 text-warning-800';
    case 'low':
      return 'bg-success-100 text-success-800';
    case 'overdue':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

const navigateToProject = (projectId) => {
  navigateTo(`/projects/${projectId}`);
};

// Data fetching
const fetchProjects = async () => {
  await projectsStore.fetchProjects();
  projects.value = projectsStore.projects;
  calculateTeamPerformance();
};

const fetchUsers = async () => {
  await usersStore.fetchUsers();
  users.value = usersStore.allUsers;
};

// Helper functions for charts and data visualization
const generateMonthLabels = () => {
  const months = [];
  const today = new Date();
  
  // Generate labels for the last 6 months
  for (let i = 5; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthLabel = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    months.push(monthLabel);
  }
  
  return months;
};

// Generate historical project data for charts
const getProjectHistoricalData = (status) => {
  const result = [0, 0, 0, 0, 0, 0]; // Array for last 6 months
  const today = new Date();
  
  // Filter projects by status and group them by month
  projects.value
    .filter(project => project.status === status)
    .forEach(project => {
      // Use created date as the reference point
      const projectDate = project.createdAt ? new Date(project.createdAt) : null;
      
      if (projectDate) {
        // Calculate months difference
        const monthsDiff = (today.getFullYear() - projectDate.getFullYear()) * 12 + 
                          (today.getMonth() - projectDate.getMonth());
        
        // If created within the last 6 months, increment the corresponding month
        if (monthsDiff >= 0 && monthsDiff < 6) {
          const index = 5 - monthsDiff; // Index in reverse order (most recent last)
          result[index]++;
        }
      }
    });
  
  return result;
};

// Calculate team performance metrics
const calculateTeamPerformance = () => {
  // Reset team performance
  teamPerformance.value = [];
  
  // Ensure we have projects and users loaded
  if (projects.value.length === 0 || users.value.length === 0) {
    return;
  }
  
  // For each user, calculate performance metrics
  users.value.forEach(user => {
    // Find all projects where this user is assigned or in the team
    const userProjects = projects.value.filter(p => {
      const isAssigned = p.assignedTo === user.id || p.assignedTo === user._id;
      const isResponsiblePerson = p.responsiblePerson === user.id || p.responsiblePerson === user._id;
      const isInTeam = p.team && Array.isArray(p.team) && 
                      (p.team.includes(user.id) || p.team.includes(user._id));
      const isInDevelopers = p.developers && Array.isArray(p.developers) && 
                            (p.developers.includes(user.id) || p.developers.includes(user._id));
      return isAssigned || isInTeam || isInDevelopers || isResponsiblePerson;
    });
    
    const completed = userProjects.filter(p => p.status === 'Completed');
    let onTimeCount = 0;
    
    completed.forEach(p => {
      // Check if project was completed before deadline
      const deadline = p.deadline || p.endDate;
      if (deadline) {
        // If lastUpdated is not available, assume it was completed on time
        if (!p.lastUpdated) {
          onTimeCount++;
        } else {
          const completedDate = new Date(p.lastUpdated);
          const deadlineDate = new Date(deadline);
          if (completedDate <= deadlineDate) {
            onTimeCount++;
          }
        }
      }
    });
    
    // Calculate average progress for ongoing projects
    const ongoingProjects = userProjects.filter(p => p.status === 'Ongoing');
    const totalProgress = ongoingProjects.reduce((sum, p) => {
      return sum + (typeof p.progress === 'number' ? p.progress : 0);
    }, 0);
    
    const avgProgress = ongoingProjects.length ? Math.round(totalProgress / ongoingProjects.length) : 0;
    const onTimeRate = completed.length ? Math.round((onTimeCount / completed.length) * 100) : 0;
    
    // Add user performance data
    teamPerformance.value.push({
      id: user.id || user._id,
      name: user.name,
      role: user.role || 'Team Member',
      assignedProjects: userProjects.length,
      completedProjects: completed.length,
      avgProgress: avgProgress,
      onTimeRate: onTimeRate
    });
  });
  
  // Sort by most assigned projects first
  teamPerformance.value.sort((a, b) => b.assignedProjects - a.assignedProjects);
};

// Chart initialization
const initializeCharts = () => {
  // Project status distribution chart
  const statusChartCtx = document.getElementById('statusChart');
  if (statusChartCtx) {
    new Chart(statusChartCtx, {
      type: 'doughnut',
      data: {
        labels: ['Ongoing', 'Completed', 'On Hold', 'At Risk'],
        datasets: [{
          data: [ongoingCount.value, completedCount.value, onHoldCount.value, atRiskCount.value],
          backgroundColor: [
            '#4f46e5', // primary color for ongoing
            '#10b981', // success color for completed
            '#f59e0b', // warning color for on hold
            '#ef4444'  // error color for at risk
          ],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                return `${label}: ${value} projects`;
              }
            }
          }
        }
      }
    });
  }
  
  // Progress over time chart
  const progressChartCtx = document.getElementById('progressChart');
  if (progressChartCtx) {
    new Chart(progressChartCtx, {
      type: 'line',
      data: {
        labels: generateMonthLabels(),
        datasets: [
          {
            label: 'Completed Projects',
            data: getProjectHistoricalData('Completed'),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          }, 
          {
            label: 'Ongoing Projects',
            data: getProjectHistoricalData('Ongoing'),
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'On Hold Projects',
            data: getProjectHistoricalData('On Hold'),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return context[0].label;
              },
              label: function(context) {
                return context.dataset.label + ': ' + context.raw + ' projects';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
    });
  }
  
  // Workload chart
  const workloadChartCtx = document.getElementById('workloadChart');
  if (workloadChartCtx && teamPerformance.value.length > 0) {
    const labels = teamPerformance.value.slice(0, 7).map(m => m.name);
    const data = teamPerformance.value.slice(0, 7).map(m => m.assignedProjects);
    
    new Chart(workloadChartCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Assigned Projects',
          data: data,
          backgroundColor: 'rgba(79, 70, 229, 0.6)',
          borderColor: '#4f46e5',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const member = teamPerformance.value[context.dataIndex];
                return [
                  `Completed: ${member.completedProjects}`,
                  `Progress: ${member.avgProgress}%`,
                  `On-time: ${member.onTimeRate}%`
                ];
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Projects'
            }
          }
        }
      }
    });
  }
};

// Watch for search query changes
watch(searchQuery, () => {
  // Reinitialize charts when the data changes due to filtering
  setTimeout(initializeCharts, 100);
});

// Project timeline marker position and class methods
const getProjectMarkerPosition = (project) => {
  // Position markers on timeline based on days to deadline
  let xPercent = 75; // Default to "safe" zone
  
  if (project.daysToDeadline < 0) {
    // Overdue projects go in first quarter
    xPercent = Math.max(5, 25 + (project.daysToDeadline / 14) * 25);
  } else if (project.daysToDeadline < 7) {
    // Projects due within a week go in second quarter
    xPercent = 25 + ((project.daysToDeadline / 7) * 25);
  } else if (project.daysToDeadline < 14) {
    // Projects due within two weeks go in third quarter
    xPercent = 50 + ((project.daysToDeadline - 7) / 7) * 25;
  } else {
    // Projects with more than two weeks go in last quarter
    xPercent = 75 + Math.min(20, ((project.daysToDeadline - 14) / 30) * 20);
  }
  
  // Random Y position to avoid overlap
  const yPercent = 20 + Math.floor(Math.random() * 60);
  
  return `left: ${xPercent}%; top: ${yPercent}%;`;
};

const getProjectMarkerClass = (project) => {
  if (project.daysToDeadline < 0) {
    return 'bg-error-600';
  } else if (project.daysToDeadline < 7) {
    return 'bg-warning-600';
  } else if (project.daysToDeadline < 14) {
    return 'bg-accent-600';
  } else {
    return 'bg-success-600';
  }
};

// Lifecycle hooks
onMounted(async () => {
  isLoading.value = true;
  try {
    await fetchUsers();
    await fetchProjects();
    
    // Initialize charts after data is loaded
    setTimeout(initializeCharts, 100);
  } catch (error) {
    console.error('Error loading report data:', error);
    notificationsStore.error('Failed to load report data');
  } finally {
    isLoading.value = false;
  }
});

// Project Risk Assessment
const calculateProjectRiskStatus = (project) => {
  // Skip completed projects
  if (project.status === 'Completed') return 'Low';
  
  // Calculate days to deadline
  const deadlineDate = project.deadline ? new Date(project.deadline) : 
                        project.endDate ? new Date(project.endDate) : null;
  
  if (!deadlineDate) return 'Low'; // No deadline, assume low risk
  
  const daysToDeadline = Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24));
  
  // Check for blockers as a risk indicator
  const hasBlockers = project.blockers && project.blockers.trim().length > 0;
  
  // Urgent priority projects are higher risk
  const isUrgentPriority = project.priority === 'Urgent' || project.priority === 'High';
  
  // Calculate risk based on multiple factors
  if (daysToDeadline < 0) {
    return 'High'; // Overdue
  } else if (daysToDeadline < 3 || (daysToDeadline < 7 && project.progress < 70)) {
    return 'High'; // Close deadline with insufficient progress
  } else if (hasBlockers && daysToDeadline < 14) {
    return 'High'; // Has blockers and deadline approaching
  } else if (daysToDeadline < 7 || (daysToDeadline < 14 && project.progress < 50) || 
            (isUrgentPriority && project.progress < 60)) {
    return 'Medium'; // Various medium risk conditions
  } else {
    return 'Low'; // Otherwise low risk
  }
};
</script>

<style scoped>
.shadow-card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
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