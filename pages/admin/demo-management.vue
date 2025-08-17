<script setup>
import { ref, onMounted } from 'vue';

// Page metadata
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
});

const isLoading = ref(false);
const demoStatus = ref(null);
const demoDataStatus = ref(null);

// Check if user has admin permissions
const authStore = useAuthStore();
const canManageDemo = computed(() => 
  authStore.isSuperAdmin || authStore.hasPermission('admin', 'manage')
);

// Load demo status
const loadDemoStatus = async () => {
  try {
    isLoading.value = true;
    const response = await $fetch('/api/demo/status');
    demoStatus.value = response;
    demoDataStatus.value = response.data;
  } catch (error) {
    console.error('Error loading demo status:', error);
  } finally {
    isLoading.value = false;
  }
};

// Seed demo data
const seedDemoData = async () => {
  try {
    isLoading.value = true;
    const response = await $fetch('/api/demo/seed', { method: 'POST' });
    await loadDemoStatus();
    useToast().success('Demo data seeded successfully');
  } catch (error) {
    console.error('Error seeding demo data:', error);
    useToast().error('Failed to seed demo data');
  } finally {
    isLoading.value = false;
  }
};

// Reset demo data
const resetDemoData = async () => {
  try {
    isLoading.value = true;
    const response = await $fetch('/api/demo/reset', { method: 'POST' });
    await loadDemoStatus();
    useToast().success('Demo data reset successfully');
  } catch (error) {
    console.error('Error resetting demo data:', error);
    useToast().error('Failed to reset demo data');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  if (canManageDemo.value) {
    loadDemoStatus();
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900">Demo Management</h1>
        <p class="text-neutral-600 mt-1">Manage demo data and demo mode settings</p>
      </div>
    </div>

    <!-- Access Control -->
    <div v-if="!canManageDemo" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center">
        <span class="mdi mdi-shield-alert text-red-600 text-lg mr-3"></span>
        <div>
          <h3 class="text-sm font-medium text-red-800">Access Denied</h3>
          <p class="text-sm text-red-700 mt-1">You don't have permission to access demo management.</p>
        </div>
      </div>
    </div>

    <!-- Demo Management Content -->
    <div v-else class="space-y-6">
      <!-- Demo Mode Status -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Demo Mode Status</h2>
        
        <div v-if="isLoading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
        </div>
        
        <div v-else-if="demoStatus" class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div class="flex items-center">
              <div 
                :class="[
                  'w-3 h-3 rounded-full mr-3',
                  demoStatus.demoMode ? 'bg-green-500' : 'bg-red-500'
                ]"
              ></div>
              <div>
                <p class="font-medium text-neutral-900">Demo Mode</p>
                <p class="text-sm text-neutral-600">
                  {{ demoStatus.demoMode ? 'Enabled' : 'Disabled' }}
                </p>
              </div>
            </div>
            <span 
              :class="[
                'px-2 py-1 text-xs font-medium rounded-full',
                demoStatus.demoMode 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              ]"
            >
              {{ demoStatus.demoMode ? 'Active' : 'Inactive' }}
            </span>
          </div>
          
          <div class="text-sm text-neutral-600">
            <p>{{ demoStatus.message }}</p>
          </div>
        </div>
      </div>

      <!-- Demo Data Status -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Demo Data Status</h2>
        
        <div v-if="demoDataStatus" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Users Status -->
            <div class="p-4 bg-neutral-50 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-neutral-900">Demo Users</h3>
                <span 
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    demoDataStatus.usersExist 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  ]"
                >
                  {{ demoDataStatus.usersExist ? 'Available' : 'Not Available' }}
                </span>
              </div>
              <p class="text-sm text-neutral-600">
                {{ demoDataStatus.userCount }} demo users in database
              </p>
            </div>
            
            <!-- Projects Status -->
            <div class="p-4 bg-neutral-50 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium text-neutral-900">Demo Projects</h3>
                <span 
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    demoDataStatus.projectsExist 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  ]"
                >
                  {{ demoDataStatus.projectsExist ? 'Available' : 'Not Available' }}
                </span>
              </div>
              <p class="text-sm text-neutral-600">
                {{ demoDataStatus.projectCount }} demo projects in database
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Demo Data Actions -->
      <div class="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <h2 class="text-lg font-semibold text-neutral-900 mb-4">Demo Data Actions</h2>
        
        <div class="space-y-4">
          <div class="flex items-start space-x-4">
            <div class="flex-1">
              <h3 class="font-medium text-neutral-900 mb-2">Seed Demo Data</h3>
              <p class="text-sm text-neutral-600 mb-3">
                Initialize the database with sample demo data including users, projects, and related information.
              </p>
              <button 
                @click="seedDemoData"
                :disabled="isLoading"
                class="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isLoading" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                Seed Demo Data
              </button>
            </div>
          </div>
          
          <div class="border-t border-neutral-200 pt-4">
            <div class="flex items-start space-x-4">
              <div class="flex-1">
                <h3 class="font-medium text-neutral-900 mb-2">Reset Demo Data</h3>
                <p class="text-sm text-neutral-600 mb-3">
                  Clear existing demo data and reinitialize with fresh sample data.
                </p>
                <button 
                  @click="resetDemoData"
                  :disabled="isLoading"
                  class="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="isLoading" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                  Reset Demo Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Demo Information -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div class="flex items-start">
          <span class="mdi mdi-information text-blue-600 text-lg mr-3 mt-0.5"></span>
          <div>
            <h3 class="text-sm font-medium text-blue-900 mb-2">About Demo Mode</h3>
            <div class="text-sm text-blue-700 space-y-2">
              <p>
                Demo mode allows users to explore the application with sample data without affecting production data.
              </p>
              <p>
                Demo users can access all features with realistic sample projects, users, and Jira integration data.
              </p>
              <p>
                All changes made in demo mode are temporary and will be reset when the demo data is refreshed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
