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
  if (!process.client) return;

  try {
    // Check for error parameters in URL
    if (route.query.error) {
      error.value = `${route.query.error}: ${route.query.error_description || 'Authentication failed'}`;
      setTimeout(() => router.push('/login'), 3000);
      return;
    }
    
    status.value = 'Finalizing authentication with Microsoft...';
    
    // Create MSAL instance for handling this redirect
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
    
    try {
      // Initialize MSAL first
      await msalInstance.initialize();
      
      // Handle redirect - this returns null if called outside of a redirect context
      const response = await msalInstance.handleRedirectPromise();
      
      // Get any accounts that might be in the cache
      const accounts = msalInstance.getAllAccounts();
      
      if (response) {
        // We have a direct response from the redirect
        console.log("Authentication successful", response);
        
        // Get the user account from the response
        const account = response.account;
        if (account) {
          // Set the user in our auth store
          authStore.setUser({
            id: account.localAccountId || account.homeAccountId,
            displayName: account.name || "User",
            userPrincipalName: account.username,
            mail: account.username,
            // Store tokens for API calls (you would typically do this in auth store)
            accessToken: response.accessToken,
            idToken: response.idToken
          });
          
          status.value = 'Authentication successful! Redirecting...';
          setTimeout(() => router.push('/dashboard'), 1000);
          return;
        }
      } else if (accounts.length > 0) {
        // No direct response, but we have accounts in the cache
        const account = accounts[0];
        
        // Try to get a token silently to verify the account is valid
        try {
          const silentRequest = {
            scopes: ['User.Read'],
            account: account
          };
          
          const silentResult = await msalInstance.acquireTokenSilent(silentRequest);
          
          if (silentResult) {
            // Account is valid, set the user in auth store
            authStore.setUser({
              id: account.localAccountId || account.homeAccountId,
              displayName: account.name || "User",
              userPrincipalName: account.username,
              mail: account.username,
              accessToken: silentResult.accessToken,
              idToken: silentResult.idToken
            });
            
            status.value = 'Authentication verified! Redirecting...';
            setTimeout(() => router.push('/dashboard'), 1000);
            return;
          }
        } catch (silentErr) {
          console.warn('Silent token acquisition failed:', silentErr);
          // Continue to login redirect below
        }
      }
      
      // If we reach here, we couldn't authenticate
      error.value = 'Authentication failed or session expired';
      setTimeout(() => router.push('/login'), 2000);
      
    } catch (msalErr) {
      console.error('MSAL error:', msalErr);
      error.value = `Authentication error: ${msalErr.message || 'Unknown MSAL error'}`;
      setTimeout(() => router.push('/login'), 3000);
    }
  } catch (err) {
    console.error('General auth redirect error:', err);
    error.value = 'Authentication failed. Please try again.';
    setTimeout(() => router.push('/login'), 3000);
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