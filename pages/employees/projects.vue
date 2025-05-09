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
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
    </div>
    
    <!-- Summary statistics -->
    <div v-else-if="users.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      </div>
      
      <div class="bg-white p-5 rounded-xl shadow-card hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
        <div class="flex items-center mb-3">
          <div class="w-12 h-12 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
            <span class="mdi mdi-account-alert text-2xl"></span>
          </div>
          <h3 class="ml-4 text-lg font-medium text-neutral-700">Unassigned Users</h3>
        </div>
        <p class="text-4xl font-bold text-neutral-900">{{ users.length - usersWithProjects.length }}</p>
      </div>
    </div>
    
    <!-- User Projects List -->
    <div v-if="!loading" class="space-y-6">
      <!-- Empty state -->
      <div v-if="filteredUsers.length === 0" class="bg-white rounded-lg shadow-card p-10 text-center">
        <div class="flex flex-col items-center">
          <span class="mdi mdi-account-search text-6xl text-neutral-300 mb-4"></span>
          <h3 class="text-lg font-medium text-neutral-700 mb-2">No employees found</h3>
          <p class="text-neutral-500">{{ searchQuery || roleFilter !== 'all' ? 'Try adjusting your search or filters' : 'Add some employees to get started' }}</p>
        </div>
      </div>
      
      <!-- User Cards with Projects -->
      <div v-else>
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
              <div class="bg-neutral-50 rounded-md p-3 border border-neutral-100">
                <div class="text-sm text-neutral-500 mb-1">Lead Projects</div>
                <div class="text-xl font-bold text-neutral-800">{{ getUserLeadProjects(user).length }}</div>
              </div>
              
              <div class="bg-neutral-50 rounded-md p-3 border border-neutral-100">
                <div class="text-sm text-neutral-500 mb-1">As Responsible Person</div>
                <div class="text-xl font-bold text-neutral-800">{{ getUserResponsibleProjects(user).length }}</div>
              </div>
              
              <div class="bg-neutral-50 rounded-md p-3 border border-neutral-100">
                <div class="text-sm text-neutral-500 mb-1">Team Member</div>
                <div class="text-xl font-bold text-neutral-800">{{ getUserTeamProjects(user).length }}</div>
              </div>
              
              <div class="bg-neutral-50 rounded-md p-3 border border-neutral-100">
                <div class="text-sm text-neutral-500 mb-1">Development</div>
                <div class="text-xl font-bold text-neutral-800">{{ getUserDevelopmentProjects(user).length }}</div>
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
                      <div 
                        v-for="role in getUserProjectRoles(user, project)" 
                        :key="role" 
                        :class="[
                          'text-xs px-2 py-0.5 rounded-full inline-block mb-1 mr-1',
                          getProjectRoleBadgeClass(role)
                        ]"
                      >
                        {{ role }}
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <span 
                        :class="[
                          'px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                          project.status === 'Completed' ? 'bg-success-100 text-success-800' : 
                          project.status === 'Ongoing' ? 'bg-accent-100 text-accent-800' : 
                          'bg-warning-100 text-warning-800'
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
                      <div class="text-sm text-neutral-700">{{ project.startDate || 'Not set' }} - {{ project.endDate || 'Not set' }}</div>
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
import { ref, computed, onMounted } from 'vue';
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

// Load data
onMounted(async () => {
  try {
    loading.value = true;
    await Promise.all([
      usersStore.fetchUsers(),
      projectsStore.fetchProjects()
    ]);
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

// Filter users based on search query and role filter
const filteredUsers = computed(() => {
  let filtered = users.value;
  
  // Apply role filter
  if (roleFilter.value !== 'all') {
    filtered = filtered.filter(user => user.role === roleFilter.value);
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

// Count users who have at least one project assigned
const usersWithProjects = computed(() => {
  return users.value.filter(user => getUserAllProjects(user).length > 0);
});
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