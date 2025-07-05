<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Debug Information -->
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 class="text-lg font-medium text-yellow-800 mb-2">Debug Information</h3>
      <div class="text-sm text-yellow-700 space-y-1">
        <p><strong>Authenticated:</strong> {{ authStore.isAuthenticated }}</p>
        <p><strong>Session Valid:</strong> {{ authStore.isSessionValid }}</p>
        <p><strong>User Email:</strong> {{ authStore.userEmail || 'Not set' }}</p>
        <p><strong>Role:</strong> {{ authStore.role || 'Not assigned' }}</p>
        <p><strong>Permissions Count:</strong> {{ authStore.permissions?.length || 0 }}</p>
        <p><strong>Expires At:</strong> {{ authStore.expiresAt || 'Not set' }}</p>
      </div>
    </div>

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Role-Based Authentication System</h1>
      <p class="text-gray-600">Complete implementation examples and current user permissions</p>
    </div>

    <!-- Current User Info -->
    <div class="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Current User Information</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-gray-700">Name:</label>
              <p class="text-gray-900">{{ authStore.userFullName || 'Not provided' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700">Email:</label>
              <p class="text-gray-900">{{ authStore.userEmail || 'Not provided' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700">Role:</label>
              <div class="mt-1">
                <RoleBadge :role="authStore.role" v-if="authStore.role" />
                <span v-else class="text-gray-500">No role assigned</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-gray-700">Authentication Status:</label>
              <p :class="authStore.isAuthenticated ? 'text-green-600' : 'text-red-600'">
                {{ authStore.isAuthenticated ? 'Authenticated' : 'Not Authenticated' }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700">Role Level:</label>
              <p class="text-gray-900">{{ authStore.isManager ? 'Manager Level' : 'Employee Level' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700">Admin Status:</label>
              <p :class="authStore.isSuperAdmin ? 'text-purple-600' : 'text-gray-600'">
                {{ authStore.isSuperAdmin ? 'Super Administrator' : 'Regular User' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Permission Examples -->
    <div class="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Permission Examples</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="example in permissionExamples" :key="example.title" class="border rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-2">{{ example.title }}</h3>
          <div class="space-y-2">
            <div v-for="permission in example.permissions" :key="`${permission.resource}-${permission.action}`" class="flex items-center justify-between">
              <span class="text-sm text-gray-600">{{ permission.label }}</span>
              <span v-if="authStore.hasPermission(permission.resource, permission.action)" class="text-green-600">
                <span class="mdi mdi-check-circle text-lg"></span>
              </span>
              <span v-else class="text-red-600">
                <span class="mdi mdi-close-circle text-lg"></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- UI Components with Role Restrictions -->
    <div class="bg-white rounded-lg border border-gray-200 p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Role-Based UI Components</h2>
      <div class="space-y-4">
        
        <!-- Project Management Actions -->
        <div class="border rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-3">Project Management</h3>
          <div class="flex flex-wrap gap-3">
            <button 
              v-if="authStore.canCreateResource('projects')"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <span class="mdi mdi-plus mr-2"></span>
              Create Project
            </button>
            <button 
              v-if="authStore.hasPermission('projects', 'update')"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span class="mdi mdi-pencil mr-2"></span>
              Edit Projects
            </button>
            <button 
              v-if="authStore.hasPermission('projects', 'delete')"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <span class="mdi mdi-delete mr-2"></span>
              Delete Projects
            </button>
            <span v-if="!authStore.canAccessResource('projects')" class="text-gray-500 italic">
              No project permissions
            </span>
          </div>
        </div>

        <!-- User Management Actions -->
        <div class="border rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-3">User Management</h3>
          <div class="flex flex-wrap gap-3">
            <button 
              v-if="authStore.canAccessResource('users')"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span class="mdi mdi-account-group mr-2"></span>
              View Users
            </button>
            <button 
              v-if="authStore.hasPermission('users', 'update')"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span class="mdi mdi-account-edit mr-2"></span>
              Edit User Roles
            </button>
            <span v-if="!authStore.canAccessResource('users')" class="text-gray-500 italic">
              No user management permissions
            </span>
          </div>
        </div>

        <!-- Reporting & Analytics -->
        <div class="border rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-3">Reports & Analytics</h3>
          <div class="flex flex-wrap gap-3">
            <button 
              v-if="authStore.canAccessResource('reports')"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <span class="mdi mdi-chart-line mr-2"></span>
              View Reports
            </button>
            <button 
              v-if="authStore.hasPermission('reports', 'create')"
              class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <span class="mdi mdi-chart-box-plus-outline mr-2"></span>
              Create Reports
            </button>
            <span v-if="!authStore.canAccessResource('reports')" class="text-gray-500 italic">
              No reporting permissions
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Code Examples -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Implementation Examples</h2>
      <div class="space-y-6">
        
        <!-- Template Examples -->
        <div>
          <h3 class="font-medium text-gray-900 mb-2">Template Usage Examples</h3>
          <div class="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre class="text-gray-800">{{ templateExamples }}</pre>
          </div>
        </div>

        <!-- Script Examples -->
        <div>
          <h3 class="font-medium text-gray-900 mb-2">Script Usage Examples</h3>
          <div class="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre class="text-gray-800">{{ scriptExamples }}</pre>
          </div>
        </div>

        <!-- Middleware Examples -->
        <div>
          <h3 class="font-medium text-gray-900 mb-2">Server-Side Protection Examples</h3>
          <div class="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <pre class="text-gray-800">{{ middlewareExamples }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

// Debug logging
onMounted(() => {
  console.log('Auth Demo - Auth Store State:', {
    isAuthenticated: authStore.isAuthenticated,
    isSessionValid: authStore.isSessionValid,
    role: authStore.role,
    permissions: authStore.permissions,
    user: authStore.user
  });
});

// Permission examples for testing
const permissionExamples = [
  {
    title: 'Project Permissions',
    permissions: [
      { resource: 'projects', action: 'read', label: 'View Projects' },
      { resource: 'projects', action: 'create', label: 'Create Projects' },
      { resource: 'projects', action: 'update', label: 'Edit Projects' },
      { resource: 'projects', action: 'delete', label: 'Delete Projects' }
    ]
  },
  {
    title: 'User Permissions',
    permissions: [
      { resource: 'users', action: 'read', label: 'View Users' },
      { resource: 'users', action: 'update', label: 'Edit User Roles' },
      { resource: 'users', action: 'delete', label: 'Delete Users' }
    ]
  },
  {
    title: 'Report Permissions',
    permissions: [
      { resource: 'reports', action: 'read', label: 'View Reports' },
      { resource: 'reports', action: 'create', label: 'Create Reports' },
      { resource: 'reports', action: 'update', label: 'Edit Reports' }
    ]
  }
];

// Code examples
const templateExamples = `<!-- Basic permission checking -->
<button v-if="authStore.hasPermission('projects', 'create')">
  Create Project
</button>

<!-- Resource access checking -->
<div v-if="authStore.canAccessResource('users')">
  User management content...
</div>

<!-- Role-based UI -->
<AdminPanel v-if="authStore.isSuperAdmin" />
<ManagerDashboard v-else-if="authStore.isManager" />
<UserDashboard v-else />

<!-- Create permission checking -->
<NewProjectButton v-if="authStore.canCreateResource('projects')" />`;

const scriptExamples = `// In your Vue component script
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();

// Check permissions programmatically
const canEditProject = authStore.hasPermission('projects', 'update');
const isAdmin = authStore.isSuperAdmin;
const userRole = authStore.role;

// Create conditional methods
const handleProjectAction = () => {
  if (authStore.canCreateResource('projects')) {
    // Proceed with project creation
  } else {
    // Show permission denied message
  }
};`;

const middlewareExamples = `// In server API routes
import { requirePermission } from '~/server/utils/auth-roles';

export default defineEventHandler(async (event) => {
  // Require specific permission
  await requirePermission('projects', 'create')(event);
  
  // Your API logic here
  return { success: true };
});

// In pages with definePageMeta
definePageMeta({
  middleware: 'auth',
  requiresRole: 'MANAGER' // Custom middleware
});`;
</script>