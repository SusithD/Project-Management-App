<script setup>
import { ref, onMounted, provide } from 'vue';
import { useRouter } from 'vue-router';
import { PublicClientApplication, BrowserAuthError } from '@azure/msal-browser';
import { useAuthStore } from '~/stores/auth';

const config = useRuntimeConfig();
const router = useRouter();
const authStore = useAuthStore();
const isAuthenticated = ref(false);
const isLoading = ref(true);
const user = ref(null);
const msalInstance = ref(null);
const loginInProgress = ref(false);

// Provide auth context to child components
provide('isAuthenticated', isAuthenticated);
provide('user', user);

// Initialize MSAL instance
const initializeMsal = async () => {
  if (!msalInstance.value) {
    const msalConfig = {
      auth: {
        clientId: config.public.msalConfig.auth.clientId,
        authority: config.public.msalConfig.auth.authority,
        redirectUri: config.public.msalConfig.auth.redirectUri,
        navigateToLoginRequestUrl: true
      },
      cache: {
        cacheLocation: 'localStorage',
        storeAuthStateInCookie: true // Set to true for IE support
      }
    };
    
    msalInstance.value = new PublicClientApplication(msalConfig);
    await msalInstance.value.initialize();
    
    // Register redirect handlers
    msalInstance.value.addEventCallback((event) => {
      // Log events for debugging
      if (event.eventType) {
        console.log(`MSAL Event: ${event.eventType}`, event);
      }
    });
  }
  return msalInstance.value;
};

// Handle MSAL redirect response
const handleRedirectResponse = async (instance) => {
  try {
    // Handle the response from the redirect
    const response = await instance.handleRedirectPromise();
    
    // If we have a response, it means a redirect was just completed
    if (response) {
      console.log("Redirect completed successfully", response);
      
      // Get all accounts 
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        // Set authenticated user
        user.value = accounts[0];
        isAuthenticated.value = true;
        
        // Update auth store
        authStore.setUser({
          id: accounts[0].localAccountId || accounts[0].homeAccountId,
          displayName: accounts[0].name,
          userPrincipalName: accounts[0].username,
          mail: accounts[0].username
        });
        
        // Redirect to dashboard after successful login
        router.push('/dashboard');
      }
    }
  } catch (error) {
    console.error('Error handling redirect:', error);
    
    if (error instanceof BrowserAuthError) {
      if (error.errorCode === 'interaction_in_progress') {
        console.log('Authentication interaction already in progress');
      }
    }
  }
};

onMounted(async () => {
  // Initialize MSAL in client-side only
  if (process.client) {
    try {
      const instance = await initializeMsal();
      
      // Handle any redirect response first
      await handleRedirectResponse(instance);
      
      // After handling redirect, check if user is already logged in
      const accounts = instance.getAllAccounts();
      
      if (accounts.length > 0) {
        isAuthenticated.value = true;
        user.value = accounts[0];
        
        // Set user in auth store
        authStore.setUser({
          id: accounts[0].localAccountId || accounts[0].homeAccountId,
          displayName: accounts[0].name,
          userPrincipalName: accounts[0].username,
          mail: accounts[0].username
        });
        
        // If on login page, redirect to dashboard
        if (router.currentRoute.value.path === '/login') {
          router.push('/dashboard');
        }
      } else if (router.currentRoute.value.path !== '/login' && 
                 router.currentRoute.value.path !== '/auth/redirect') {
        // Redirect to login if not authenticated and not on login or redirect page
        router.push('/login');
      }
    } catch (error) {
      console.error('MSAL initialization error:', error);
    } finally {
      isLoading.value = false;
    }
  }
});

// Login function
const login = async () => {
  if (loginInProgress.value) {
    console.log('Login already in progress, waiting for completion...');
    return;
  }

  try {
    loginInProgress.value = true;
    const instance = await initializeMsal();
    
    // Configure login request for implicit flow or hybrid flow
    // depending on what the application registration supports
    const loginRequest = {
      scopes: ["User.Read", "openid", "profile", "email"],
      redirectUri: config.public.msalConfig.auth.redirectUri
    };
    
    // Use loginRedirect with the configured request
    await instance.loginRedirect(loginRequest);
  } catch (error) {
    if (error instanceof BrowserAuthError && 
        error.errorCode === 'interaction_in_progress') {
      console.log('Login is already in progress');
    } else {
      console.error('Login error:', error);
    }
  } finally {
    loginInProgress.value = false;
  }
};

const logout = async () => {
  if (loginInProgress.value) {
    console.log('Authentication in progress, cannot logout at this time');
    return;
  }

  try {
    loginInProgress.value = true;
    const instance = await initializeMsal();
    
    // Clear auth store
    authStore.clearUser();
    
    // Logout with proper config
    await instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin + "/login"
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    loginInProgress.value = false;
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