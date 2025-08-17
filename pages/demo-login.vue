<script setup>
import { ref, inject, onMounted } from 'vue';

// Page metadata - use default layout (not dashboard)
definePageMeta({
  layout: 'default'
});

// Use client-side demo data
const { DEMO_USERS, usersByRole, getRoleDisplayName, getRoleDescription } = useDemoData();

const login = inject('login');
const isLoading = ref(false);
const showAnimation = ref(false);
const selectedUser = ref(null);
const showUserSelection = ref(false);

// Demo login function
const handleDemoLogin = async (user) => {
  isLoading.value = true;
  try {
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Set demo user in auth store
    const authStore = useAuthStore();
    authStore.setDemoUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleName: user.role,
      permissions: [], // Will be set by the store
      lastActive: new Date().toISOString(),
      joinedAt: user.joinedAt,
      avatar: user.avatar,
      department: user.department,
      skills: user.skills,
      availability: user.availability
    });
    
    // Navigate to dashboard
    await navigateTo('/dashboard');
  } catch (error) {
    console.error('Demo login error:', error);
  } finally {
    isLoading.value = false;
  }
};



// Add animation effect when page loads
onMounted(() => {
  setTimeout(() => {
    showAnimation.value = true;
  }, 100);
});
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row items-stretch bg-neutral-50">
    <!-- Left panel - Illustration/Image -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 to-primary-500 text-white p-12 relative overflow-hidden">
      <div class="absolute inset-0 bg-pattern opacity-10"></div>
      
      <div class="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-white">
              <span class="mdi mdi-chart-timeline-variant text-primary-600 text-xl"></span>
            </div>
            <h2 class="text-2xl font-bold">Project Manager</h2>
          </div>
          
          <div class="mt-16">
            <h1 class="text-4xl font-bold leading-tight">Demo Environment</h1>
            <p class="mt-6 text-lg text-primary-100">
              Experience the full capabilities of our project management platform.
              Choose a role to explore different user perspectives and features.
            </p>
          </div>
        </div>
        
        <!-- Features list -->
        <div class="mt-auto">
          <div class="space-y-4">
            <div class="flex items-center">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-200 bg-opacity-30">
                <span class="mdi mdi-check text-white"></span>
              </div>
              <p class="ml-4 text-white">Role-based access control</p>
            </div>
            
            <div class="flex items-center">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-200 bg-opacity-30">
                <span class="mdi mdi-check text-white"></span>
              </div>
              <p class="ml-4 text-white">Sample projects and data</p>
            </div>
            
            <div class="flex items-center">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-200 bg-opacity-30">
                <span class="mdi mdi-check text-white"></span>
              </div>
              <p class="ml-4 text-white">Jira integration demo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Right panel - Demo Login form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6">
      <div 
        :class="[
          'w-full max-w-2xl transition-all duration-500 ease-out transform', 
          showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        ]"
      >
        <div class="bg-white p-8 rounded-2xl shadow-xl">
          <div class="text-center mb-8">
            <!-- Logo and Company Name -->
            <div 
              class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 mb-5 shadow-lg transform transition-transform hover:scale-105 duration-300"
            >
              <span class="mdi mdi-chart-timeline-variant text-white text-3xl"></span>
            </div>
            <h1 class="text-2xl font-bold text-neutral-900 mt-2">Project Manager</h1>
            <h2 class="text-xl font-medium text-neutral-700 mt-1">Demo Environment</h2>
            <p class="text-neutral-600 mt-3">Select a role to explore the platform with sample data.</p>
          </div>
          
          <!-- Demo User Selection -->
          <div class="space-y-6">
            <div v-for="(users, role) in usersByRole" :key="role" class="border border-neutral-200 rounded-lg p-4">
              <div class="mb-4">
                <h3 class="text-lg font-semibold text-neutral-900">{{ getRoleDisplayName(role) }}</h3>
                <p class="text-sm text-neutral-600">{{ getRoleDescription(role) }}</p>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div 
                  v-for="user in users" 
                  :key="user.id"
                  @click="handleDemoLogin(user)"
                  :disabled="isLoading"
                  class="flex items-center p-3 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-all duration-200 group"
                >
                  <div class="flex-shrink-0 mr-3">
                    <img 
                      :src="user.avatar" 
                      :alt="user.name"
                      class="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-neutral-900 truncate">{{ user.name }}</p>
                    <p class="text-xs text-neutral-500 truncate">{{ user.email }}</p>
                    <p class="text-xs text-neutral-400 truncate">{{ user.department }}</p>
                  </div>
                  <div class="flex-shrink-0">
                    <span class="mdi mdi-chevron-right text-neutral-400 group-hover:text-primary-600 transition-colors"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Loading State -->
          <div v-if="isLoading" class="mt-6 text-center">
            <div class="inline-flex items-center text-primary-600">
              <div class="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent mr-2"></div>
              <span>Logging in...</span>
            </div>
          </div>
          
          <!-- Demo Info -->
          <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <span class="mdi mdi-information text-blue-600 text-lg"></span>
              </div>
              <div class="ml-3">
                <h4 class="text-sm font-medium text-blue-900">Demo Environment</h4>
                <p class="text-sm text-blue-700 mt-1">
                  This is a demonstration environment with sample data. All changes are temporary and will be reset when you refresh the page.
                </p>
              </div>
            </div>
          </div>
          
          <!-- Alternative access options -->
          <div class="mt-6">
            <div class="relative py-3">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-neutral-200"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="bg-white px-3 text-sm text-neutral-500">Or</span>
              </div>
            </div>
          </div>
          
          <!-- Production Login Link -->
          <div class="mt-4 text-center">
            <NuxtLink 
              to="/login" 
              class="text-sm text-primary-600 hover:text-primary-800 flex items-center justify-center transition-colors"
            >
              <span class="mdi mdi-login mr-1"></span>
              Go to Production Login
            </NuxtLink>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="text-center mt-6 text-xs text-neutral-500">
          <p>© 2025 Project Manager. All rights reserved.</p>
          <p class="mt-1">Demo Environment v2.4.1</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Background pattern */
.bg-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>
