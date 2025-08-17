<script setup>
import { ref, inject, onMounted } from 'vue';

// Check if we're in demo mode
const config = useRuntimeConfig();
const isDemoMode = config.public.demoMode || process.env.DEMO_MODE === 'true';

// Auto-redirect to demo login if in demo mode
if (isDemoMode) {
  navigateTo('/demo-login');
}

const login = inject('login');
const isLoading = ref(false);
const showAnimation = ref(false);

const handleLogin = async () => {
  isLoading.value = true;
  try {
    await login();
  } catch (error) {
    console.error('Login error:', error);
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
  <!-- Demo Mode Notice -->
  <div v-if="isDemoMode" class="min-h-screen flex items-center justify-center bg-neutral-50">
    <div class="max-w-md w-full mx-auto">
      <div class="bg-white p-8 rounded-2xl shadow-xl text-center">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 mb-6 shadow-lg">
          <span class="mdi mdi-information text-white text-3xl"></span>
        </div>
        
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Demo Environment</h2>
        <p class="text-gray-600 mb-6">
          This is a demonstration environment. Regular login is disabled.
          You'll be redirected to the demo login page.
        </p>
        
        <div class="space-y-3">
          <button 
            @click="navigateTo('/demo-login')"
            class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Demo Login
          </button>
          
          <div class="text-sm text-gray-500">
            <div class="flex items-center justify-center space-x-1">
              <span class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              <span>Demo Mode Active</span>
            </div>
          </div>
        </div>
        
        <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-xs text-yellow-700">
            <span class="mdi mdi-shield-check mr-1"></span>
            All data shown is sample data for demonstration purposes only
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Original Login Form (Production Only) -->
  <div v-else class="min-h-screen flex flex-col md:flex-row items-stretch bg-neutral-50">
    <!-- Left panel - Illustration/Image -->
    <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 to-primary-500 text-white p-12 relative overflow-hidden">
      <div class="absolute inset-0 bg-pattern opacity-10"></div>
      
      <div class="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div class="flex items-center space-x-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-white">
              <span class="mdi mdi-chart-timeline-variant text-primary-600 text-xl"></span>
            </div>
            <h2 class="text-2xl font-bold">The qexle Project Manager</h2>
          </div>
          
          <div class="mt-16">
            <h1 class="text-4xl font-bold leading-tight">Manage Your Projects with Confidence</h1>
            <p class="mt-6 text-lg text-primary-100">
              Track progress, collaborate with your team, and deliver results on time.
              Your all-in-one project management solution.
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
              <p class="ml-4 text-white">Real-time collaboration tools</p>
            </div>
            
            <div class="flex items-center">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-200 bg-opacity-30">
                <span class="mdi mdi-check text-white"></span>
              </div>
              <p class="ml-4 text-white">Advanced analytics & reporting</p>
            </div>
            
            <div class="flex items-center">
              <div class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-200 bg-opacity-30">
                <span class="mdi mdi-check text-white"></span>
              </div>
              <p class="ml-4 text-white">Secure Microsoft integration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Right panel - Login form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6">
      <div 
        :class="[
          'w-full max-w-md transition-all duration-500 ease-out transform', 
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
            <h1 class="text-2xl font-bold text-neutral-900 mt-2">The qexle Project Manager</h1>
            <h2 class="text-xl font-medium text-neutral-700 mt-1">Project Management Platform</h2>
            <p class="text-neutral-600 mt-3">Sign in with your company Microsoft account to access your projects.</p>
          </div>
          
          <!-- Login Button -->
          <button 
            @click="handleLogin" 
            :disabled="isLoading"
            class="w-full flex items-center justify-center bg-primary-600 text-white py-4 px-5 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <span v-if="isLoading" class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
            <span class="mdi mdi-microsoft text-xl mr-2" v-else></span>
            <span>Sign in with Microsoft</span>
          </button>
          
          <!-- Alternative access options if needed -->
          <div class="mt-6">
            <div class="relative py-3">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-neutral-200"></div>
              </div>
              <div class="relative flex justify-center">
                <span class="bg-white px-3 text-sm text-neutral-500">Need help?</span>
              </div>
            </div>
          </div>
          
          <!-- Help options -->
          <div class="mt-4 flex justify-center space-x-4">
            <a href="#" class="text-sm text-primary-600 hover:text-primary-800 flex items-center transition-colors">
              <span class="mdi mdi-help-circle mr-1"></span>
              Support
            </a>
            <a href="#" class="text-sm text-primary-600 hover:text-primary-800 flex items-center transition-colors">
              <span class="mdi mdi-email-outline mr-1"></span>
              Contact IT
            </a>
          </div>
          
          <!-- Additional Info -->
          <div class="mt-8 text-center text-sm text-neutral-600">
            <p>This application is only accessible to The qexle Project Manager employees.</p>
            <p class="mt-2">
              <span class="mdi mdi-shield-check text-success-500 mr-1"></span>
              Secured with enterprise-grade protection
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="text-center mt-6 text-xs text-neutral-500">
          <p>© 2025 The qexle Project Manager. All rights reserved.</p>
          <p class="mt-1">Version 2.4.1</p>
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