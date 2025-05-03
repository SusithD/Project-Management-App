<script setup>
import { ref, inject } from 'vue';

const login = inject('login');
const isLoading = ref(false);

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
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-neutral-100">
    <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-card">
      <div class="text-center mb-8">
        <!-- Logo and Company Name -->
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 mb-4">
          <span class="mdi mdi-chart-timeline-variant text-white text-3xl"></span>
        </div>
        <h1 class="text-2xl font-bold text-neutral-900">Project Progress Management</h1>
        <p class="text-neutral-600 mt-2">Sign in with your company Microsoft account</p>
      </div>
      
      <!-- Login Button -->
      <button 
        @click="handleLogin" 
        :disabled="isLoading"
        class="w-full flex items-center justify-center bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
      >
        <span v-if="isLoading" class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
        <span class="mdi mdi-microsoft text-xl mr-2" v-else></span>
        <span>Sign in with Microsoft</span>
      </button>
      
      <!-- Additional Info -->
      <div class="mt-8 text-center text-sm text-neutral-600">
        <p>This application is only accessible to company employees.</p>
        <p class="mt-2">Please contact IT support if you have trouble signing in.</p>
      </div>
    </div>
  </div>
</template>