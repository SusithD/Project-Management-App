/**
 * Auth Session Plugin
 * 
 * This plugin manages session persistence across page navigation and refreshes.
 * It validates the authentication state on route changes and updates activity timestamps.
 */

import { useAuthStore } from '~/stores/auth';
import { PublicClientApplication } from '@azure/msal-browser';

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

export default defineNuxtPlugin(async (nuxtApp) => {
  // Skip on server-side
  if (!process.client) return;
  
  // Get auth store
  const authStore = useAuthStore();
  const config = useRuntimeConfig();
  
  // Flag to track if we've already attempted to restore the session
  let sessionRestored = false;

  // Session validation check
  const validateSession = async () => {
    // Only validate if authenticated according to our store
    if (!authStore.isAuthenticated) return false;
    
    // Check local validation first
    const locallyValid = authStore.validateSession();
    if (locallyValid) {
      return true;
    }
    
    // If we reach here, local validation failed but we think we're authenticated
    // Try to validate with MSAL
    try {
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
      
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        // Get MSAL account that matches our user
        const account = accounts[0];
        
        // Attempt to refresh the token silently
        try {
          const silentRequest = {
            scopes: ['User.Read', 'openid', 'profile', 'email'],
            account: account,
            forceRefresh: true
          };
          
          const silentResult = await msalInstance.acquireTokenSilent(silentRequest);
          if (silentResult) {
            // Successfully got a new token, update our store
            const refreshToken = getMsalRefreshToken(account.homeAccountId);
            
            authStore.setUser({
              id: account.localAccountId || account.homeAccountId?.split('.')[0],
              tenantId: account.tenantId || account.idTokenClaims?.tid,
              displayName: account.name || authStore.user?.displayName || "User",
              userPrincipalName: account.username || authStore.user?.userPrincipalName,
              mail: account.username || authStore.user?.mail,
              role: authStore.role || 'business_analyst',
              accessToken: silentResult.accessToken,
              idToken: silentResult.idToken,
              refreshToken,
              expiresIn: silentResult.expiresOn ? 
                Math.floor((silentResult.expiresOn - Date.now()) / 1000) : 
                3600,
              account
            });
            
            console.log('[Auth Plugin] Session restored via silent token acquisition');
            return true;
          }
        } catch (error) {
          console.error('[Auth Plugin] Error refreshing token:', error);
          return false;
        }
      } else {
        // No accounts found in MSAL, but we think we're authenticated
        // Clear our local state as it's invalid
        authStore.clearUser();
        return false;
      }
    } catch (error) {
      console.error('[Auth Plugin] Error validating session with MSAL:', error);
      return false;
    }
    
    return false;
  };
  
  // Initial session restoration on app load 
  const restoreSession = async () => {
    // Only restore once to prevent loops
    if (sessionRestored) return;
    sessionRestored = true;
    
    // Skip if we're already handling auth (e.g., on the login or redirect page)
    const route = useRoute();
    if (route.path === '/login' || route.path === '/auth/redirect') {
      return;
    }
    
    // If user is authenticated according to our store, validate the session
    if (authStore.isAuthenticated) {
      try {
        const isValid = await validateSession();
        
        // If validation failed, navigate to login
        if (!isValid) {
          console.log('[Auth Plugin] Session validation failed on restore, redirecting to login');
          await navigateTo('/login');
        }
      } catch (error) {
        console.error('[Auth Plugin] Error restoring session:', error);
        await navigateTo('/login');
      }
    }
  };
  
  // Setup route change handlers
  nuxtApp.hook('page:start', async () => {
    // Skip for auth-related pages
    const route = useRoute();
    if (route.path === '/login' || route.path === '/auth/redirect') {
      return;
    }
    
    if (process.client && authStore.isAuthenticated) {
      // Update activity timestamp on page navigation
      authStore.updateLastActivity();
      
      // Validate session on route change
      const isValid = await validateSession();
      
      // If session is invalid and we're not already on login page, redirect
      if (!isValid && route.path !== '/login') {
        console.log('[Auth Plugin] Session expired during navigation, redirecting to login');
        await navigateTo('/login');
      }
    }
  });
  
  // Global event handlers for activity tracking
  if (process.client) {
    const updateActivity = () => {
      if (authStore.isAuthenticated) {
        authStore.updateLastActivity();
      }
    };
    
    // Attach activity listeners
    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('keypress', updateActivity, { passive: true });
    
    // Clean up event listeners on app unmount
    nuxtApp.hook('app:unmounted', () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
    });
    
    // Immediately try to restore session
    setTimeout(restoreSession, 0);
  }
});