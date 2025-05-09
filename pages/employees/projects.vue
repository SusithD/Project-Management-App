<template>
  <div>
    <!-- Header with search and filters -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div class="flex flex-col w-full md:w-auto mb-4 md:mb-0">
        <h1 class="text-2xl font-bold text-neutral-900 mb-2">Employee Projects</h1>
        <p class="text-neutral-600">View which users are working on which projects</p>
      </div>
      
      <div class="flex flex-col sm:flex-row w-full md:w-auto gap-4">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span class="mdi mdi-magnify text-gray-400"></span>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        
        <div class="relative">
          <select
            v-model="roleFilter"
            class="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="all">All Roles</option>
            <option value="Developer">Developers</option>
            <option value="Manager">Managers</option>
            <option value="Business Analyst">Business Analysts</option>
            <option value="QA Engineer">QA Engineers</option>
          </select>
        </div>

        <div class="relative">
          <select
            v-model="projectFilter"
            class="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="all">All Projects</option>
            <option value="hasProjects">With Projects</option>
            <option value="noProjects">No Projects</option>
          </select>
        </div>

        <button
          @click="toggleView"
          class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <span class="mdi" :class="viewType === 'card' ? 'mdi-table' : 'mdi-card-outline'"></span>
          <span class="ml-2">{{ viewType === 'card' ? 'Table View' : 'Card View' }}</span>
        </button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
    </div>
    
    <!-- Summary statistics -->
    <div v-else-if="users.length > 0" class="mb-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
          <div class="flex items-center mb-3">
            <div class="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
              <span class="mdi mdi-account-group text-2xl"></span>
            </div>
            <h3 class="ml-4 text-lg font-medium text-neutral-700">Total Employees</h3>
          </div>
          <p class="text-4xl font-bold text-neutral-900">{{ users.length }}</p>
        </div>
        
        <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
          <div class="flex items-center mb-3">
            <div class="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center text-accent-600">
              <span class="mdi mdi-folder-multiple text-2xl"></span>
            </div>
            <h3 class="ml-4 text-lg font-medium text-neutral-700">Total Projects</h3>
          </div>
          <p class="text-4xl font-bold text-neutral-900">{{ projects.length }}</p>
        </div>
        
        <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
          <div class="flex items-center mb-3">
            <div class="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center text-success-600">
              <span class="mdi mdi-account-check text-2xl"></span>
            </div>
            <h3 class="ml-4 text-lg font-medium text-neutral-700">Assigned Users</h3>
          </div>
          <p class="text-4xl font-bold text-neutral-900">{{ usersWithProjects.length }}</p>
          <p class="text-sm text-neutral-500 mt-1">{{ Math.round((usersWithProjects.length / users.length) * 100) }}% of total</p>
        </div>
        
        <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
          <div class="flex items-center mb-3">
            <div class="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
              <span class="mdi mdi-account-alert text-2xl"></span>
            </div>
            <h3 class="ml-4 text-lg font-medium text-neutral-700">Unassigned Users</h3>
          </div>
          <p class="text-4xl font-bold text-neutral-900">{{ users.length - usersWithProjects.length }}</p>
          <p class="text-sm text-neutral-500 mt-1">{{ Math.round(((users.length - usersWithProjects.length) / users.length) * 100) }}% of total</p>
        </div>
      </div>

      <!-- Project Distribution Chart -->
      <div class="bg-white p-6 rounded-xl shadow-card mb-8">
        <h3 class="text-lg font-medium text-neutral-700 mb-4">Project Distribution</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Role Distribution -->
          <div class="h-80">
            <canvas ref="roleDistributionChart"></canvas>
          </div>
          <!-- Project Load -->
          <div class="h-80">
            <canvas ref="projectLoadChart"></canvas>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <!-- Project Status -->
          <div class="bg-neutral-50 p-4 rounded-lg">
            <h4 class="text-sm font-medium text-neutral-700 mb-2">Project Status Distribution</h4>
            <div class="flex flex-wrap gap-3 mt-3">
              <div v-for="(count, status) in projectStatusCounts" :key="status" 
                   class="flex items-center px-3 py-2 rounded-md" 
                   :class="getStatusBackgroundClass(status)">
                <span class="w-3 h-3 rounded-full mr-2" :class="getStatusDotClass(status)"></span>
                <span class="font-medium">{{ status }}:</span>
                <span class="ml-1">{{ count }}</span>
                <span class="ml-1 text-sm text-neutral-500">({{ Math.round((count / projects.length) * 100) }}%)</span>
              </div>
            </div>
          </div>
          <!-- Top Project Roles -->
          <div class="bg-neutral-50 p-4 rounded-lg">
            <h4 class="text-sm font-medium text-neutral-700 mb-2">Most Common Employee Roles</h4>
            <div class="flex flex-wrap gap-3 mt-3">
              <div v-for="(count, role) in topEmployeeRoles" :key="role" 
                   class="flex items-center px-3 py-2 rounded-md bg-white shadow-sm">
                <span class="w-3 h-3 rounded-full mr-2" 
                     :class="getRoleBadgeClass(role).replace('bg-', '').replace('text-', '')"></span>
                <span class="font-medium">{{ role }}:</span>
                <span class="ml-1">{{ count }}</span>
                <span class="ml-1 text-sm text-neutral-500">({{ Math.round((count / users.length) * 100) }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- User Projects List -->
    <div v-if="!loading" class="space-y-6">
      <!-- Empty state -->
      <div v-if="filteredUsers.length === 0" class="bg-white rounded-lg shadow-card p-10 text-center">
        <div class="flex flex-col items-center">
          <span class="mdi mdi-account-search text-6xl text-neutral-300 mb-4"></span>
          <h3 class="text-lg font-medium text-neutral-700 mb-2">No employees found</h3>
          <p class="text-neutral-500">{{ searchQuery || roleFilter !== 'all' || projectFilter !== 'all' ? 'Try adjusting your search or filters' : 'Add some employees to get started' }}</p>
        </div>
      </div>
      
      <!-- Table View -->
      <div v-else-if="viewType === 'table'" class="bg-white rounded-lg shadow-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-neutral-200">
            <thead class="bg-neutral-50">
              <tr>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Employee</th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                <th scope="col" class="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Project Count</th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Project Roles</th>
                <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Current Projects</th>
                <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-neutral-100">
              <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-neutral-50">
                <td class="px-4 py-4">
                  <div class="flex items-center">
                    <div class="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden mr-3">
                      <span v-if="!user.avatar" class="mdi mdi-account text-xl text-neutral-400"></span>
                      <img v-else :src="user.avatar" alt="" class="h-10 w-10 object-cover" />
                    </div>
                    <div>
                      <div class="text-sm font-medium text-neutral-900">{{ user.name }}</div>
                      <div class="text-xs text-neutral-500">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span 
                    :class="[
                      'px-2 py-1 text-xs font-medium rounded-full inline-flex items-center',
                      getRoleBadgeClass(user.role)
                    ]"
                  >
                    <span class="mdi mdi-account-circle mr-1"></span>
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-4 py-4 text-center">
                  <div class="flex flex-col items-center">
                    <span class="text-lg font-bold text-neutral-700">{{ getUserAllProjects(user).length }}</span>
                    <div class="mt-1 flex items-center">
                      <span class="text-xs text-neutral-500 mr-1">Lead: {{ getUserLeadProjects(user).length }}</span>
                      <span class="text-xs text-neutral-500 mx-1">|</span>
                      <span class="text-xs text-neutral-500 ml-1">Member: {{ getUserTeamProjects(user).length }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div class="flex flex-wrap gap-1">
                    <template v-if="getUserRoleCounts(user).length > 0">
                      <div v-for="role in getUserRoleCounts(user)" :key="role.name" 
                           :class="[
                             'text-xs px-2 py-0.5 rounded-full inline-block',
                             getProjectRoleBadgeClass(role.name)
                           ]">
                        {{ role.name }}: {{ role.count }}
                      </div>
                    </template>
                    <template v-else>
                      <span class="text-xs text-neutral-500">None assigned</span>
                    </template>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <div v-if="getUserAllProjects(user).length > 0" class="flex flex-wrap gap-1">
                    <div v-for="(project, i) in getUserAllProjects(user).slice(0, 3)" :key="project.id"
                         class="text-xs px-2 py-0.5 rounded-md inline-block bg-neutral-100">
                      {{ project.name }}
                    </div>
                    <div v-if="getUserAllProjects(user).length > 3" 
                         class="text-xs px-2 py-0.5 rounded-md inline-block bg-neutral-100 text-neutral-500">
                      +{{ getUserAllProjects(user).length - 3 }} more
                    </div>
                  </div>
                  <div v-else class="text-xs text-neutral-500">
                    No projects assigned
                  </div>
                </td>
                <td class="px-4 py-4 text-right">
                  <button 
                    @click="expandedUser = expandedUser === user.id ? null : user.id"
                    class="text-primary-600 hover:text-primary-900 text-sm font-medium mr-3"
                  >
                    {{ expandedUser === user.id ? 'Hide Details' : 'View Details' }}
                  </button>
                </td>
              </tr>
              <tr v-if="expandedUser" v-for="user in filteredUsers.filter(u => u.id === expandedUser)" :key="`expanded-${user.id}`" class="bg-neutral-50">
                <td colspan="6" class="px-4 py-4">
                  <div v-if="getUserAllProjects(user).length > 0" class="overflow-x-auto">
                    <h4 class="text-md font-medium text-neutral-700 mb-3">Projects for {{ user.name }}</h4>
                    <table class="min-w-full divide-y divide-neutral-200 border border-neutral-100 rounded-md">
                      <thead class="bg-neutral-100">
                        <tr>
                          <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Project</th>
                          <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                          <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                          <th scope="col" class="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Progress</th>
                          <th scope="col" class="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-neutral-100">
                        <tr v-for="project in getUserAllProjects(user)" :key="`detail-${user.id}-${project.id}`" class="hover:bg-neutral-50">
                          <td class="px-4 py-3">
                            <div class="text-sm font-medium text-neutral-900">{{ project.name }}</div>
                            <div class="text-xs text-neutral-500">{{ project.company || 'No company specified' }}</div>
                          </td>
                          <td class="px-4 py-3">
                            <div class="flex flex-wrap gap-1">
                              <div 
                                v-for="role in getUserProjectRoles(user, project)" 
                                :key="role" 
                                :class="[
                                  'text-xs px-2 py-0.5 rounded-full inline-block',
                                  getProjectRoleBadgeClass(role)
                                ]"
                              >
                                {{ role }}
                              </div>
                            </div>
                          </td>
                          <td class="px-4 py-3">
                            <span 
                              :class="[
                                'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                                getStatusBackgroundClass(project.status)
                              ]"
                            >
                              {{ project.status }}
                            </span>
                          </td>
                          <td class="px-4 py-3">
                            <div class="flex items-center">
                              <div class="w-full bg-neutral-200 rounded-full h-2 mr-2 max-w-[100px]">
                                <div 
                                  :class="[
                                    'h-2 rounded-full',
                                    project.progress >= 80 ? 'bg-success-600' : 
                                    project.progress >= 40 ? 'bg-accent-600' : 'bg-warning-600'
                                  ]"
                                  :style="`width: ${project.progress}%`"
                                ></div>
                              </div>
                              <span class="text-xs font-medium text-neutral-700">{{ project.progress }}%</span>
                            </div>
                          </td>
                          <td class="px-4 py-3 text-right">
                            <NuxtLink 
                              :to="`/projects/${project.id}`" 
                              class="text-primary-600 hover:text-primary-900 text-sm font-medium"
                            >
                              View Project
                            </NuxtLink>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div v-else class="flex items-center justify-center py-4">
                    <span class="mdi mdi-folder-open-outline text-2xl text-neutral-300 mr-2"></span>
                    <p class="text-neutral-500">No projects assigned to this user</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Card View -->
      <div v-else class="space-y-6">
        <div v-for="user in filteredUsers" :key="user.id" class="bg-white rounded-lg shadow-card mb-6 overflow-hidden hover:shadow-lg transition-all duration-300">
          <!-- User Header -->
          <div class="p-6 border-b border-neutral-100">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="h-14 w-14 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden">
                  <span v-if="!user.avatar" class="mdi mdi-account text-2xl text-neutral-400"></span>
                  <img v-else :src="user.avatar" alt="" class="h-14 w-14 object-cover" />
                </div>
                <div class="ml-4">
                  <h2 class="text-lg font-medium text-neutral-900">{{ user.name }}</h2>
                  <div class="flex items-center text-sm text-neutral-500">
                    <span class="mdi mdi-email-outline mr-1"></span>
                    {{ user.email }}
                  </div>
                </div>
              </div>
              
              <div>
                <span 
                  :class="[
                    'px-3 py-1 text-sm font-medium rounded-full inline-flex items-center',
                    getRoleBadgeClass(user.role)
                  ]"
                >
                  <span class="mdi mdi-account-circle mr-1"></span>
                  {{ user.role }}
                </span>
              </div>
            </div>
            
            <!-- User stats summary -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div class="bg-neutral-50 rounded-md p-3 border border-neutral-100 flex flex-col items-center">
                <div class="text-sm text-neutral-500 mb-1">Lead Projects</div>
                <div class="text-xl font-bold text-neutral-800">{{ getUserLeadProjects(user).length }}</div>
                <div v-if="getUserLeadProjects(user).length > 0 && getUserAllProjects(user).length > 0" 
                     class="text-xs text-neutral-500 mt-1">
                  {{ Math.round((getUserLeadProjects(user).length / getUserAllProjects(user).length) * 100) }}% of total
                </div>
              </div>
              
              <div class="bg-neutral-50 rounded-md p-3 border border-neutral-100 flex flex-col items-center">
                <div class="text-sm text-neutral-500 mb-1">As Responsible Person</div>
                <div class="text-xl font-bold text-neutral-800">{{ getUserResponsibleProjects(user).length }}</div>
                <div v-if="getUserResponsibleProjects(user).length > 0 && getUserAllProjects(user).length > 0" 
                     class="text-xs text-neutral-500 mt-1">
                  {{ Math.round((getUserResponsibleProjects(user).length / getUserAllProjects(user).length) * 100) }}% of total
                </div>
              </div>
              
              <div class="bg-neutral-50 rounded-md p-3 border border-neutral-100 flex flex-col items-center">
                <div class="text-sm text-neutral-500 mb-1">Team Member</div>
                <div class="text-xl font-bold text-neutral-800">{{ getUserTeamProjects(user).length }}</div>
                <div v-if="getUserTeamProjects(user).length > 0 && getUserAllProjects(user).length > 0" 
                     class="text-xs text-neutral-500 mt-1">
                  {{ Math.round((getUserTeamProjects(user).length / getUserAllProjects(user).length) * 100) }}% of total
                </div>
              </div>
              
              <div class="bg-neutral-50 rounded-md p-3 border border-neutral-100 flex flex-col items-center">
                <div class="text-sm text-neutral-500 mb-1">Development</div>
                <div class="text-xl font-bold text-neutral-800">{{ getUserDevelopmentProjects(user).length }}</div>
                <div v-if="getUserDevelopmentProjects(user).length > 0 && getUserAllProjects(user).length > 0" 
                     class="text-xs text-neutral-500 mt-1">
                  {{ Math.round((getUserDevelopmentProjects(user).length / getUserAllProjects(user).length) * 100) }}% of total
                </div>
              </div>
            </div>
          </div>
          
          <!-- Projects Section -->
          <div v-if="getUserAllProjects(user).length > 0" class="px-6 py-4">
            <h3 class="text-md font-medium text-neutral-700 mb-4 flex items-center">
              <span class="mdi mdi-folder-multiple text-primary-600 mr-2"></span>
              Assigned Projects ({{ getUserAllProjects(user).length }})
            </h3>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-neutral-200">
                <thead class="bg-neutral-50">
                  <tr>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Project</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Progress</th>
                    <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Timeline</th>
                    <th scope="col" class="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-neutral-100">
                  <tr v-for="(project, index) in getUserAllProjects(user)" :key="`${user.id}-${project.id}-${index}`" class="hover:bg-neutral-50">
                    <td class="px-4 py-4">
                      <div class="text-sm font-medium text-neutral-900">{{ project.name }}</div>
                      <div class="text-xs text-neutral-500">{{ project.company || 'No company specified' }}</div>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex flex-wrap gap-1">
                        <div 
                          v-for="role in getUserProjectRoles(user, project)" 
                          :key="role" 
                          :class="[
                            'text-xs px-2 py-0.5 rounded-full inline-block',
                            getProjectRoleBadgeClass(role)
                          ]"
                        >
                          {{ role }}
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <span 
                        :class="[
                          'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                          getStatusBackgroundClass(project.status)
                        ]"
                      >
                        {{ project.status }}
                      </span>
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex items-center">
                        <div class="w-full bg-neutral-200 rounded-full h-2 mr-2 max-w-[100px]">
                          <div 
                            :class="[
                              'h-2 rounded-full',
                              project.progress >= 80 ? 'bg-success-600' : 
                              project.progress >= 40 ? 'bg-accent-600' : 'bg-warning-600'
                            ]"
                            :style="`width: ${project.progress}%`"
                          ></div>
                        </div>
                        <span class="text-xs font-medium text-neutral-700">{{ project.progress }}%</span>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <div class="text-sm text-neutral-700">{{ formatDate(project.startDate) || 'Not set' }} - {{ formatDate(project.endDate) || 'Not set' }}</div>
                    </td>
                    <td class="px-4 py-4 text-right">
                      <NuxtLink 
                        :to="`/projects/${project.id}`" 
                        class="text-primary-600 hover:text-primary-900 text-sm font-medium"
                      >
                        View Project
                      </NuxtLink>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- No Projects State -->
          <div v-else class="px-6 py-8 text-center">
            <div class="flex flex-col items-center">
              <span class="mdi mdi-folder-open-outline text-4xl text-neutral-300 mb-2"></span>
              <p class="text-neutral-500">No projects assigned to this user</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useUsersStore } from '~/stores/users';
import { useProjectsStore } from '~/stores/projects';
import { useNotificationsStore } from '~/stores/notifications';

definePageMeta({
  layout: 'dashboard'
});

// Initialize stores
const usersStore = useUsersStore();
const projectsStore = useProjectsStore();
const notificationsStore = useNotificationsStore();

// State
const loading = ref(true);
const searchQuery = ref('');
const roleFilter = ref('all');
const projectFilter = ref('all');
const viewType = ref('card'); // 'card' or 'table'
const expandedUser = ref(null);
const roleDistributionChart = ref(null);
const projectLoadChart = ref(null);

// Load data
onMounted(async () => {
  try {
    loading.value = true;
    await Promise.all([
      usersStore.fetchUsers(),
      projectsStore.fetchProjects()
    ]);
    
    // Initialize charts after data is loaded
    nextTick(() => {
      initCharts();
    });
  } catch (error) {
    console.error('Error loading data:', error);
    notificationsStore.error('Failed to load data. Please try again.');
  } finally {
    loading.value = false;
  }
});

// Computed properties
const users = computed(() => usersStore.allUsers);
const projects = computed(() => projectsStore.projects);

// Filter users based on search query, role filter, and project filter
const filteredUsers = computed(() => {
  let filtered = users.value;
  
  // Apply role filter
  if (roleFilter.value !== 'all') {
    filtered = filtered.filter(user => user.role === roleFilter.value);
  }
  
  // Apply project filter
  if (projectFilter.value === 'hasProjects') {
    filtered = filtered.filter(user => getUserAllProjects(user).length > 0);
  } else if (projectFilter.value === 'noProjects') {
    filtered = filtered.filter(user => getUserAllProjects(user).length === 0);
  }
  
  // Apply search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.name?.toLowerCase().includes(query) || 
      user.email?.toLowerCase().includes(query) || 
      user.role?.toLowerCase().includes(query) || 
      user.id?.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

// Watch for changes that should update charts
watch([filteredUsers, projects], () => {
  if (!loading.value) {
    nextTick(() => {
      updateCharts();
    });
  }
}, { deep: true });

// Status counts for projects
const projectStatusCounts = computed(() => {
  const counts = {};
  projects.value.forEach(project => {
    const status = project.status || 'Unknown';
    counts[status] = (counts[status] || 0) + 1;
  });
  return counts;
});

// Top employee roles
const topEmployeeRoles = computed(() => {
  const counts = {};
  users.value.forEach(user => {
    const role = user.role || 'Unknown';
    counts[role] = (counts[role] || 0) + 1;
  });
  return counts;
});

// Format date helper
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  } catch (e) {
    return dateStr;
  }
};

// Toggle between card and table views
const toggleView = () => {
  viewType.value = viewType.value === 'card' ? 'table' : 'card';
};

// Get status background class
const getStatusBackgroundClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-success-100 text-success-800';
    case 'Ongoing':
      return 'bg-accent-100 text-accent-800';
    case 'Pending':
      return 'bg-warning-100 text-warning-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

// Get status dot class
const getStatusDotClass = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-success-600';
    case 'Ongoing':
      return 'bg-accent-600';
    case 'Pending':
      return 'bg-warning-600';
    default:
      return 'bg-neutral-600';
  }
};

// Get role badge class
const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'Developer':
    case 'Lead Developer':
      return 'bg-accent-100 text-accent-800';
    case 'Project Manager':
    case 'Manager':
      return 'bg-success-100 text-success-800';
    case 'Admin':
      return 'bg-warning-100 text-warning-800';
    case 'Business Analyst':
      return 'bg-primary-100 text-primary-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

// Get project role badge class
const getProjectRoleBadgeClass = (role) => {
  switch (role) {
    case 'Project Lead':
      return 'bg-primary-100 text-primary-800';
    case 'Responsible Person':
      return 'bg-accent-100 text-accent-800';
    case 'Team Member':
      return 'bg-success-100 text-success-800';
    case 'Developer':
      return 'bg-warning-100 text-warning-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

// Get projects where the user is the lead
const getUserLeadProjects = (user) => {
  return projects.value.filter(project => project.assignedTo === user.id);
};

// Get projects where the user is the responsible person
const getUserResponsibleProjects = (user) => {
  return projects.value.filter(project => project.responsiblePerson === user.id);
};

// Get projects where the user is in the team
const getUserTeamProjects = (user) => {
  return projects.value.filter(project => 
    project.team && Array.isArray(project.team) && project.team.includes(user.id)
  );
};

// Get projects where the user is a developer
const getUserDevelopmentProjects = (user) => {
  return projects.value.filter(project => 
    project.developers && Array.isArray(project.developers) && project.developers.includes(user.id)
  );
};

// Get all projects for a user (with duplicates removed)
const getUserAllProjects = (user) => {
  // Combine all projects the user is involved in
  const allProjects = [
    ...getUserLeadProjects(user),
    ...getUserResponsibleProjects(user),
    ...getUserTeamProjects(user),
    ...getUserDevelopmentProjects(user)
  ];
  
  // Remove duplicates by project.id
  const uniqueProjects = [];
  const projectIds = new Set();
  
  for (const project of allProjects) {
    if (!projectIds.has(project.id)) {
      projectIds.add(project.id);
      uniqueProjects.push(project);
    }
  }
  
  return uniqueProjects;
};

// Get user roles in a specific project
const getUserProjectRoles = (user, project) => {
  const roles = [];
  
  if (project.assignedTo === user.id) {
    roles.push('Project Lead');
  }
  
  if (project.responsiblePerson === user.id) {
    roles.push('Responsible Person');
  }
  
  if (project.team && Array.isArray(project.team) && project.team.includes(user.id)) {
    roles.push('Team Member');
  }
  
  if (project.developers && Array.isArray(project.developers) && project.developers.includes(user.id)) {
    roles.push('Developer');
  }
  
  return roles;
};

// Get user role counts across all projects
const getUserRoleCounts = (user) => {
  const roleCounts = {};
  const userProjects = getUserAllProjects(user);
  
  userProjects.forEach(project => {
    const roles = getUserProjectRoles(user, project);
    roles.forEach(role => {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
  });
  
  return Object.entries(roleCounts).map(([name, count]) => ({ name, count }));
};

// Count users who have at least one project assigned
const usersWithProjects = computed(() => {
  return users.value.filter(user => getUserAllProjects(user).length > 0);
});

// Initialize charts
const initCharts = async () => {
  try {
    // Import Chart.js dynamically to avoid SSR issues
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    // Role Distribution Chart
    if (roleDistributionChart.value) {
      const roleCtx = roleDistributionChart.value.getContext('2d');
      
      // Count users by role
      const roleCounts = {};
      users.value.forEach(user => {
        const role = user.role || 'Unknown';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
      
      // Chart colors
      const colors = [
        'rgba(59, 130, 246, 0.7)', // primary
        'rgba(16, 185, 129, 0.7)', // success
        'rgba(245, 158, 11, 0.7)', // warning
        'rgba(99, 102, 241, 0.7)', // accent
        'rgba(107, 114, 128, 0.7)', // neutral
      ];
      
      new Chart(roleCtx, {
        type: 'pie',
        data: {
          labels: Object.keys(roleCounts),
          datasets: [{
            data: Object.values(roleCounts),
            backgroundColor: Object.keys(roleCounts).map((_, i) => colors[i % colors.length]),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
            },
            title: {
              display: true,
              text: 'Employee Distribution by Role'
            }
          }
        }
      });
    }
    
    // Project Load Chart
    if (projectLoadChart.value) {
      const loadCtx = projectLoadChart.value.getContext('2d');
      
      // Get users with project counts
      const projectCountsByUser = users.value.map(user => ({
        name: user.name,
        count: getUserAllProjects(user).length
      })).sort((a, b) => b.count - a.count).slice(0, 10); // Top 10 users
      
      new Chart(loadCtx, {
        type: 'bar',
        data: {
          labels: projectCountsByUser.map(u => u.name),
          datasets: [{
            label: 'Number of Projects',
            data: projectCountsByUser.map(u => u.count),
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Top 10 Employees by Project Count'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error initializing charts:', error);
  }
};

// Update charts when data changes
const updateCharts = () => {
  // Charts will be re-initialized - this would be more complex with full Chart.js implementation
  // but for simplicity we're just re-initializing
  initCharts();
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