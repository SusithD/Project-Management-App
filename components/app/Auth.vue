<script setup>
import { ref, onMounted, provide } from 'vue';
import { useRouter } from 'vue-router';
import { PublicClientApplication } from '@azure/msal-browser';

const config = useRuntimeConfig();
const router = useRouter();
const isAuthenticated = ref(false);
const isLoading = ref(true);
const user = ref(null);
const msalInstance = ref(null);

// Provide auth context to child components
provide('isAuthenticated', isAuthenticated);
provide('user', user);

// Initialize MSAL instance
const initializeMsal = async () => {
  if (!msalInstance.value) {
    msalInstance.value = new PublicClientApplication(config.public.msalConfig);
    await msalInstance.value.initialize();
  }
  return msalInstance.value;
};

onMounted(async () => {
  // Initialize MSAL in client-side only
  if (process.client) {
    try {
      await initializeMsal();
      
      // Check if user is already logged in
      const accounts = msalInstance.value.getAllAccounts();
      
      if (accounts.length > 0) {
        isAuthenticated.value = true;
        user.value = accounts[0];
        
        // If on login page, redirect to dashboard
        if (router.currentRoute.value.path === '/login') {
          router.push('/dashboard');
        }
      } else if (router.currentRoute.value.path !== '/login') {
        // Redirect to login if not authenticated and not on login page
        router.push('/login');
      }
    } catch (error) {
      console.error('MSAL initialization error:', error);
    } finally {
      isLoading.value = false;
    }
  }
});

// Expose MSAL functionality
const login = async () => {
  try {
    const instance = await initializeMsal();
    await instance.loginRedirect({
      scopes: ['user.read']
    });
  } catch (error) {
    console.error('Login error:', error);
  }
};

const logout = async () => {
  try {
    const instance = await initializeMsal();
    await instance.logoutRedirect();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Provide login and logout functions to components
provide('login', login);
provide('logout', logout);
</script>

<template>
  <div>
    <div v-if="isLoading" class="fixed inset-0 bg-primary-600 flex items-center justify-center z-50">
      <div class="text-white text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto"></div>
        <p class="mt-4 text-lg">Loading...</p>
      </div>
    </div>
    <slot v-else></slot>
  </div>
</template>