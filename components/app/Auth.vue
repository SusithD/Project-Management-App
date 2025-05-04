<script setup>
import { ref, onMounted, provide, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { PublicClientApplication, BrowserAuthError, InteractionRequiredAuthError } from '@azure/msal-browser';
import { useAuthStore } from '~/stores/auth';

const config = useRuntimeConfig();
const router = useRouter();
const authStore = useAuthStore();
const isAuthenticated = ref(authStore.isAuthenticated);
const isLoading = ref(true);
const user = ref(authStore.user);
const msalInstance = ref(null);
const loginInProgress = ref(false);
const sessionCheckInterval = ref(null);

// Provide auth context to child components
provide('isAuthenticated', isAuthenticated);
provide('user', user);

// Watch for changes in auth store
watch(() => authStore.isAuthenticated, (newValue) => {
  isAuthenticated.value = newValue;
  user.value = authStore.user;
});

// Initialize MSAL instance
const initializeMsal = async () => {
  if (msalInstance.value) {
    return msalInstance.value;
  }
  
  const msalConfig = {
    auth: {
      clientId: config.public.msalConfig.auth.clientId,
      authority: config.public.msalConfig.auth.authority,
      redirectUri: config.public.msalConfig.auth.redirectUri,
      navigateToLoginRequestUrl: true
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: true
    }
  };
  
  msalInstance.value = new PublicClientApplication(msalConfig);
  await msalInstance.value.initialize();
  
  // Register redirect handlers
  msalInstance.value.addEventCallback((event) => {
    if (event.eventType) {
      console.log(`MSAL Event: ${event.eventType}`, event);
      
      // Update activity timestamp on MSAL events
      if (authStore.isAuthenticated) {
        authStore.updateLastActivity();
      }
    }
  });
  
  return msalInstance.value;
};

// Get refresh token from MSAL
const getMsalRefreshToken = async (accountId) => {
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
    console.error('Error getting refresh token:', error);
  }
  
  return null;
};

// Handle MSAL redirect response
const handleRedirectResponse = async (instance) => {
  try {
    // Handle the response from the redirect
    const response = await instance.handleRedirectPromise();
    
    // If we have a response, it means a redirect was just completed
    if (response) {
      console.log("Redirect completed successfully", response);
      
      // Get user account from response
      const account = response.account;
      if (account) {
        // Calculate expiry from token response
        const expiresIn = response.expiresOn ? 
          Math.floor((response.expiresOn - Date.now()) / 1000) : 
          3600;
        
        // Get refresh token if available
        const refreshToken = await getMsalRefreshToken(account.homeAccountId);
        
        // Update auth store with complete account and token information
        authStore.completeAuthentication({
          account,
          accessToken: response.accessToken,
          idToken: response.idToken,
          refreshToken,
          expiresIn
        });
        
        isAuthenticated.value = true;
        user.value = account;
        
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

// Check if token is valid, attempt to refresh if needed
const validateAndRefreshSession = async () => {
  // Skip if login in progress or not client-side
  if (loginInProgress.value || !process.client) return;
  
  try {
    // First check our local session validity
    const isValid = authStore.validateSession();
    
    if (!isValid && authStore.isAuthenticated) {
      // Our local session is invalid but we think we're authenticated
      // Try to silently refresh token with MSAL
      const instance = await initializeMsal();
      const accounts = instance.getAllAccounts();
      
      if (accounts.length > 0) {
        try {
          const silentRequest = {
            scopes: ['User.Read', 'openid', 'profile', 'email'],
            account: accounts[0],
            forceRefresh: true
          };
          
          const silentResult = await instance.acquireTokenSilent(silentRequest);
          if (silentResult) {
            const refreshToken = await getMsalRefreshToken(accounts[0].homeAccountId);
            
            // Update tokens in auth store
            authStore.setUser({
              ...authStore.user,
              accessToken: silentResult.accessToken,
              idToken: silentResult.idToken,
              refreshToken,
              expiresIn: silentResult.expiresOn ? 
                Math.floor((silentResult.expiresOn - Date.now()) / 1000) : 
                3600,
              account: accounts[0]
            });
            
            console.log('Session refreshed silently');
            return true;
          }
        } catch (error) {
          if (error instanceof InteractionRequiredAuthError) {
            console.warn('Interactive login required to refresh session');
            
            // Clear session if interaction is required - user needs to log in again
            authStore.clearUser();
            isAuthenticated.value = false;
            user.value = null;
            
            // Only redirect to login if not already there
            if (router.currentRoute.value.path !== '/login') {
              router.push('/login');
            }
          } else {
            console.error('Error refreshing token:', error);
          }
        }
      } else {
        // No accounts found - user needs to log in
        authStore.clearUser();
        isAuthenticated.value = false;
        user.value = null;
      }
    }
    
    return isValid;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
};

// Setup periodic session validation
const setupSessionValidation = () => {
  // Clear any existing interval
  if (sessionCheckInterval.value) {
    clearInterval(sessionCheckInterval.value);
  }
  
  // Check session every 5 minutes
  sessionCheckInterval.value = setInterval(validateAndRefreshSession, 5 * 60 * 1000);
  
  // Update activity timestamp on user interaction
  if (process.client) {
    ['click', 'touchstart', 'mousemove', 'keypress'].forEach(eventType => {
      window.addEventListener(eventType, () => {
        if (authStore.isAuthenticated) {
          authStore.updateLastActivity();
        }
      }, { passive: true });
    });
  }
};

onMounted(async () => {
  // Initialize MSAL in client-side only
  if (process.client) {
    try {
      const instance = await initializeMsal();
      
      // Handle any redirect response first
      await handleRedirectResponse(instance);
      
      // Validate local session
      const isSessionValid = authStore.validateSession();
      
      // After handling redirect, check if user is already logged in via MSAL
      const accounts = instance.getAllAccounts();
      
      if (accounts.length > 0) {
        if (!authStore.isAuthenticated || !isSessionValid) {
          // We have an MSAL account but not in our store or our session is invalid
          try {
            // Try to get tokens silently
            const silentRequest = {
              scopes: ['User.Read', 'openid', 'profile', 'email'],
              account: accounts[0]
            };
            
            const silentResult = await instance.acquireTokenSilent(silentRequest);
            
            if (silentResult) {
              // Get refresh token
              const refreshToken = await getMsalRefreshToken(accounts[0].homeAccountId);
              
              // Calculate token expiry
              const expiresIn = silentResult.expiresOn ? 
                Math.floor((silentResult.expiresOn - Date.now()) / 1000) : 
                3600;
              
              // Update auth store with the account
              const account = silentResult.account;
              authStore.setUser({
                id: account.localAccountId || account.homeAccountId?.split('.')[0],
                tenantId: account.tenantId || account.idTokenClaims?.tid,
                displayName: account.name || "User",
                userPrincipalName: account.username,
                mail: account.username,
                role: 'business_analyst', // Default role
                accessToken: silentResult.accessToken,
                idToken: silentResult.idToken,
                refreshToken,
                expiresIn,
                account
              });
              
              isAuthenticated.value = true;
              user.value = account;
            }
          } catch (error) {
            console.error('Error getting token silently:', error);
            
            if (error instanceof InteractionRequiredAuthError) {
              // User needs to re-authenticate
              authStore.clearUser();
              
              if (router.currentRoute.value.path !== '/login' && 
                  router.currentRoute.value.path !== '/auth/redirect') {
                router.push('/login');
              }
            }
          }
        }
      } else if (!authStore.isAuthenticated && 
                 router.currentRoute.value.path !== '/login' && 
                 router.currentRoute.value.path !== '/auth/redirect') {
        // No accounts in MSAL and not authenticated in store
        // Redirect to login if not on login or redirect page
        router.push('/login');
      }
      
      // Setup session validation interval
      setupSessionValidation();
    } catch (error) {
      console.error('MSAL initialization error:', error);
    } finally {
      isLoading.value = false;
    }
  } else {
    isLoading.value = false;
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
    
    // Configure login request
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
    
    // Clear auth store first
    authStore.clearUser();
    isAuthenticated.value = false;
    user.value = null;
    
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

// Cleanup on component unmount
onUnmounted(() => {
  if (sessionCheckInterval.value) {
    clearInterval(sessionCheckInterval.value);
  }
});

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