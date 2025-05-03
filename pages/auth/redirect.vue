<script setup>
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { PublicClientApplication } from '@azure/msal-browser';
import { useAuthStore } from '~/stores/auth';

const router = useRouter();
const route = useRoute();
const config = useRuntimeConfig();
const authStore = useAuthStore();
const error = ref('');
const status = ref('Processing authentication...');

onMounted(async () => {
  if (process.client) {
    try {
      // Check for error parameters in URL
      if (route.query.error) {
        error.value = `${route.query.error}: ${route.query.error_description || 'Authentication failed'}`;
        setTimeout(() => {
          router.push('/login');
        }, 3000);
        return;
      }
      
      status.value = 'Finalizing authentication with Microsoft...';
      
      // Create a new MSAL instance for handling this redirect
      const msalConfig = {
        auth: {
          clientId: config.public.msalConfig.auth.clientId,
          authority: config.public.msalConfig.auth.authority,
          redirectUri: config.public.msalConfig.auth.redirectUri
        },
        cache: {
          cacheLocation: 'localStorage',
          storeAuthStateInCookie: true
        }
      };
      
      const msalInstance = new PublicClientApplication(msalConfig);
      await msalInstance.initialize();
      
      try {
        // Handle the redirect flow including URL fragments for implicit flow
        const response = await msalInstance.handleRedirectPromise(window.location.hash);
        
        // Check if we got a response
        if (response) {
          console.log("Authentication successful", response);
          
          // Get the accounts from MSAL
          const accounts = msalInstance.getAllAccounts();
          
          if (accounts.length > 0) {
            // Update the auth store
            authStore.setUser({
              id: accounts[0].localAccountId || accounts[0].homeAccountId,
              displayName: accounts[0].name || "User",
              userPrincipalName: accounts[0].username,
              mail: accounts[0].username
            });
            
            status.value = 'Authentication successful! Redirecting...';
            setTimeout(() => {
              router.push('/dashboard');
            }, 1000);
            return;
          }
        }
        
        // Check if user is already authenticated
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          // User is already logged in
          authStore.setUser({
            id: accounts[0].localAccountId || accounts[0].homeAccountId,
            displayName: accounts[0].name || "User",
            userPrincipalName: accounts[0].username,
            mail: accounts[0].username
          });
          
          status.value = 'Already authenticated! Redirecting...';
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          // No user found, redirect to login
          error.value = 'No authenticated user found';
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        }
      } catch (err) {
        console.error('MSAL redirect handling error:', err);
        
        // Still try to check if we have an account (sometimes errors happen but authentication succeeds)
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          // User is authenticated despite the error
          authStore.setUser({
            id: accounts[0].localAccountId || accounts[0].homeAccountId,
            displayName: accounts[0].name || "User",
            userPrincipalName: accounts[0].username,
            mail: accounts[0].username
          });
          
          status.value = 'Authentication completed! Redirecting...';
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          error.value = `Authentication error: ${err.message || 'Unknown error'}`;
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      }
    } catch (err) {
      error.value = 'Authentication failed. Please try again.';
      console.error('Auth redirect error:', err);
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-neutral-100">
    <div v-if="!error" class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
    <p v-if="!error" class="mt-4 text-lg text-neutral-700">{{ status }}</p>
    
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto p-4" role="alert">
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline"> {{ error }}</span>
      <p class="mt-2">Redirecting to login page...</p>
    </div>
  </div>
</template>