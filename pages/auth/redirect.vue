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

// Get refresh token from MSAL storage
const getMsalRefreshToken = (accountId) => {
  if (!process.client || !accountId) return null;
  
  try {
    // Find refresh token in localStorage
    const refreshTokenKey = Object.keys(localStorage).find(key => {
      return key.includes(accountId) && key.includes('refreshtoken');
    });
    
    if (refreshTokenKey) {
      const refreshTokenData = JSON.parse(localStorage.getItem(refreshTokenKey));
      return refreshTokenData?.secret || null;
    }
  } catch (error) {
    console.error('Error extracting refresh token:', error);
  }
  
  return null;
};

onMounted(async () => {
  if (!process.client) return;

  try {
    // Check for error parameters in URL
    if (route.query.error) {
      error.value = `${route.query.error}: ${route.query.error_description || 'Authentication failed'}`;
      setTimeout(() => router.push('/login'), 3000);
      return;
    }
    
    status.value = 'Finalizing authentication...';
    
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
      
      // Handle redirect
      const response = await msalInstance.handleRedirectPromise();
      
      if (response) {
        // We have a direct response from the redirect
        console.log("Authentication successful via redirect", response);
        
        // Get the user account from the response
        const account = response.account;
        if (account) {
          // Calculate token expiry
          const expiresIn = response.expiresOn ? 
            Math.floor((response.expiresOn - Date.now()) / 1000) : 
            3600; // Default to 1 hour
          
          // Extract refresh token from MSAL storage
          const refreshToken = getMsalRefreshToken(account.homeAccountId);
          
          // Set the user in our auth store with complete token information
          authStore.setUser({
            id: account.localAccountId || account.homeAccountId?.split('.')[0],
            tenantId: account.tenantId || account.idTokenClaims?.tid,
            displayName: account.name || "User",
            userPrincipalName: account.username,
            mail: account.username,
            accessToken: response.accessToken,
            idToken: response.idToken,
            refreshToken,
            expiresIn,
            account
          });
          
          status.value = 'Authentication successful! Redirecting...';
          setTimeout(() => router.push('/dashboard'), 1000);
          return;
        }
      } else {
        // Check if we have accounts in the cache
        const accounts = msalInstance.getAllAccounts();
        
        if (accounts.length > 0) {
          // We have a cached account, try to get tokens silently
          const account = accounts[0];
          
          try {
            const silentRequest = {
              scopes: ['User.Read', 'openid', 'profile', 'email'],
              account: account,
              forceRefresh: true // Force refresh to ensure we get fresh tokens
            };
            
            const silentResult = await msalInstance.acquireTokenSilent(silentRequest);
            
            if (silentResult) {
              // Extract refresh token from MSAL storage
              const refreshToken = getMsalRefreshToken(account.homeAccountId);
              
              // Calculate token expiry
              const expiresIn = silentResult.expiresOn ? 
                Math.floor((silentResult.expiresOn - Date.now()) / 1000) : 
                3600; // Default to 1 hour
              
              // Set the user in auth store with fresh tokens
              authStore.setUser({
                id: account.localAccountId || account.homeAccountId?.split('.')[0],
                tenantId: account.tenantId || account.idTokenClaims?.tid,
                displayName: account.name || "User",
                userPrincipalName: account.username,
                mail: account.username,
                accessToken: silentResult.accessToken,
                idToken: silentResult.idToken,
                refreshToken,
                expiresIn,
                account
              });
              
              status.value = 'Session restored! Redirecting...';
              setTimeout(() => router.push('/dashboard'), 1000);
              return;
            }
          } catch (silentErr) {
            console.warn('Silent token acquisition failed:', silentErr);
            // Attempt interactive login as fallback
            error.value = 'Your session expired. Please log in again.';
            setTimeout(() => router.push('/login'), 2000);
            return;
          }
        }
        
        // If we reach here without returning, we couldn't get a valid session
        error.value = 'Authentication failed. Unable to establish a session.';
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch (msalErr) {
      console.error('MSAL error during auth redirect:', msalErr);
      error.value = `Authentication error: ${msalErr.message || 'Unknown error processing authentication'}`;
      setTimeout(() => router.push('/login'), 2000);
    }
  } catch (err) {
    console.error('General auth redirect error:', err);
    error.value = 'Authentication failed. Please try again.';
    setTimeout(() => router.push('/login'), 2000);
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-neutral-100">
    <div v-if="!error" class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto"></div>
      <p class="mt-4 text-lg text-neutral-700">{{ status }}</p>
    </div>
    
    <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md mx-auto" role="alert">
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline"> {{ error }}</span>
      <p class="mt-2">Redirecting to login page...</p>
    </div>
  </div>
</template>