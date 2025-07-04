import { defineStore } from 'pinia';
import { ROLES } from '~/server/config/roles';

export const useAuthStore = defineStore('auth', {
  state: () => {
    // Initialize state with values from localStorage if available
    let savedState = null;
    
    if (process.client) {
      try {
        const storedState = localStorage.getItem('auth_state');
        if (storedState) {
          savedState = JSON.parse(storedState);
          
          // Check if the stored state has an expiry and if it's valid
          if (savedState.expiresAt && new Date(savedState.expiresAt) < new Date()) {
            // Session has expired, clear it
            localStorage.removeItem('auth_state');
            savedState = null;
          }
        }
      } catch (error) {
        console.error('Error parsing stored auth state:', error);
        localStorage.removeItem('auth_state');
      }
    }
    
    return {
      user: savedState?.user || null,
      isAuthenticated: savedState?.isAuthenticated || false,
      role: savedState?.role || null,
      roleName: savedState?.roleName || null,
      permissions: savedState?.permissions || [],
      accessToken: savedState?.accessToken || null,
      idToken: savedState?.idToken || null,
      refreshToken: savedState?.refreshToken || null,
      expiresAt: savedState?.expiresAt || null,
      lastActivity: savedState?.lastActivity || null,
      msalAccountId: savedState?.msalAccountId || null
    };
  },
  
  getters: {
    // Role-based getters
    isSuperAdmin: (state) => state.role === 'SUPER_ADMIN',
    isManager: (state) => state.role === 'MANAGER',
    isBusinessAnalyst: (state) => state.role === 'BUSINESS_ANALYST',
    isDeveloper: (state) => state.role === 'DEVELOPER',
    isDesigner: (state) => state.role === 'DESIGNER',
    isHR: (state) => state.role === 'HR',
    
    userFullName: (state) => state.user?.displayName || state.user?.name || 'User',
    userEmail: (state) => state.user?.mail || state.user?.userPrincipalName || '',
    
    // New getter to check if the session is valid
    isSessionValid: (state) => {
      if (!state.isAuthenticated || !state.expiresAt) {
        return false;
      }
      
      // Check if the token is still valid
      const now = new Date();
      const expiresAt = new Date(state.expiresAt);
      return now < expiresAt;
    },
    
    // Getter for authorization header
    authHeader: (state) => {
      return state.accessToken ? `Bearer ${state.accessToken}` : '';
    }
  },
  
  actions: {
    // Extract refresh token from MSAL storage
    extractRefreshTokenFromMsal() {
      if (!process.client) return null;
      
      try {
        // Get account ID from our state
        const accountId = this.msalAccountId;
        if (!accountId) return null;
        
        // Look for refresh token in localStorage
        const refreshTokenKey = Object.keys(localStorage).find(key => {
          return key.includes(accountId) && key.includes('refreshtoken');
        });
        
        if (refreshTokenKey) {
          const refreshTokenData = JSON.parse(localStorage.getItem(refreshTokenKey));
          return refreshTokenData?.secret || null;
        }
        
        return null;
      } catch (error) {
        console.error('Error extracting refresh token:', error);
        return null;
      }
    },
    
    // Set user and authentication details with role assignment
    async setUser(userData) {
      try {
        // Call our backend to get proper role assignment
        const response = await $fetch('/api/auth/user', {
          method: 'POST',
          body: {
            email: userData.mail || userData.userPrincipalName,
            name: userData.displayName || userData.name,
            accessToken: userData.accessToken,
            idToken: userData.idToken
          }
        });
        
        if (response.success) {
          // Update store with backend response including role
          this.user = userData;
          this.isAuthenticated = true;
          this.role = response.user.role;
          this.roleName = response.user.roleName;
          this.permissions = response.user.permissions;
          
          // Store MSAL account ID for later token extraction
          if (userData.account) {
            const homeAccountId = userData.account.homeAccountId || 
                                 (userData.account.localAccountId && userData.account.tenantId ? 
                                  `${userData.account.localAccountId}.${userData.account.tenantId}` : null);
            if (homeAccountId) {
              this.msalAccountId = homeAccountId;
            }
          } else if (userData.id && userData.tenantId) {
            this.msalAccountId = `${userData.id}.${userData.tenantId}`;
          }
          
          // Store tokens if they exist
          this.accessToken = userData.accessToken || null;
          this.idToken = userData.idToken || null;
          
          // Store refresh token from userData or try to extract from MSAL storage
          this.refreshToken = userData.refreshToken || this.extractRefreshTokenFromMsal();
          
          // Set the expiry - default to 1 day if not provided
          const expiresInMs = userData.expiresIn ? userData.expiresIn * 1000 : 24 * 60 * 60 * 1000;
          this.expiresAt = new Date(Date.now() + expiresInMs).toISOString();
          
          // Set last activity timestamp
          this.updateLastActivity();
          
          // Persist state to localStorage
          this.persistState();
        }
      } catch (error) {
        console.error('Error setting user with role:', error);
        throw error;
      }
    },
    
    // Clear user and authentication details
    clearUser() {
      this.user = null;
      this.isAuthenticated = false;
      this.role = null;
      this.roleName = null;
      this.permissions = [];
      this.accessToken = null;
      this.idToken = null;
      this.refreshToken = null;
      this.expiresAt = null;
      this.lastActivity = null;
      this.msalAccountId = null;
      
      // Clear persisted state
      if (process.client) {
        localStorage.removeItem('auth_state');
      }
    },
    
    // Update the last activity timestamp
    updateLastActivity() {
      this.lastActivity = new Date().toISOString();
      
      // If authenticated, persist the updated state
      if (this.isAuthenticated) {
        this.persistState();
      }
    },
    
    // Persist the current state to localStorage
    persistState() {
      if (process.client) {
        try {
          // Check if we need to extract refresh token from MSAL
          if (!this.refreshToken && this.msalAccountId) {
            this.refreshToken = this.extractRefreshTokenFromMsal();
          }
          
          localStorage.setItem('auth_state', JSON.stringify({
            user: this.user,
            isAuthenticated: this.isAuthenticated,
            role: this.role,
            roleName: this.roleName,
            permissions: this.permissions,
            accessToken: this.accessToken,
            idToken: this.idToken,
            refreshToken: this.refreshToken,
            expiresAt: this.expiresAt,
            lastActivity: this.lastActivity,
            msalAccountId: this.msalAccountId
          }));
        } catch (error) {
          console.error('Error persisting auth state:', error);
        }
      }
    },
    
    // Complete the authentication process after OAuth redirect
    async completeAuthentication(authData) {
      try {
        console.log('Processing authentication data');
        
        if (!authData || !authData.account) {
          throw new Error('Invalid authentication data');
        }
        
        const account = authData.account;
        const tenantId = account.tenantId || account.realm || 
                         (account.idTokenClaims && account.idTokenClaims.tid);
        
        // Prepare user data with tokens
        const userData = {
          id: account.localAccountId || account.homeAccountId?.split('.')[0],
          tenantId: tenantId,
          displayName: account.name || "User",
          userPrincipalName: account.username,
          mail: account.username,
          accessToken: authData.accessToken || null,
          idToken: authData.idToken || null,
          refreshToken: authData.refreshToken || null,
          expiresIn: authData.expiresIn || 3600, // Default to 1 hour if not specified
          account: account
        };
        
        await this.setUser(userData);
        return true;
      } catch (error) {
        console.error('Failed to complete authentication:', error);
        this.clearUser();
        throw error;
      }
    },
    
    // Check if user has permission to perform an action
    hasPermission(resource, action) {
      if (!this.isAuthenticated || !this.isSessionValid) {
        return false;
      }
      
      // Super admin has access to everything
      if (this.isSuperAdmin) {
        return true;
      }
      
      // Check specific permissions from the role configuration
      return this.permissions.some(permission => {
        const resourceMatch = permission.resource === '*' || permission.resource === resource;
        const actionMatch = permission.actions.includes('*') || permission.actions.includes(action);
        return resourceMatch && actionMatch;
      });
    },
    
    // Check if user can access a resource (read permission)
    canAccessResource(resource) {
      return this.hasPermission(resource, 'read');
    },
    
    // Check if user can edit/update a resource
    canEditResource(resource) {
      return this.hasPermission(resource, 'update');
    },
    
    // Check if user can create resources
    canCreateResource(resource) {
      return this.hasPermission(resource, 'create');
    },
    
    // Check if user can delete resources
    canDeleteResource(resource) {
      return this.hasPermission(resource, 'delete');
    },
    
    // Attempt to refresh the access token
    async refreshAccessToken() {
      if (!process.client) {
        return false;
      }
      
      try {
        // If we have MSAL account ID but no refresh token, try to get it from storage
        if (!this.refreshToken && this.msalAccountId) {
          this.refreshToken = this.extractRefreshTokenFromMsal();
        }
        
        if (!this.refreshToken) {
          console.warn('No refresh token available for token refresh');
          return false;
        }
        
        // In a real application, make an API call to refresh the token using the refresh token
        // For this demo, we'll extend the expiry and simulate a refresh
        
        // Extend expiry by 1 hour
        const expiresInMs = 60 * 60 * 1000;
        this.expiresAt = new Date(Date.now() + expiresInMs).toISOString();
        this.persistState();
        
        console.log('Token refreshed successfully');
        return true;
      } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
      }
    },
    
    // Validate the current session
    validateSession() {
      if (!this.isAuthenticated) {
        return false;
      }
      
      // If no expiry set, consider the session invalid
      if (!this.expiresAt) {
        return false;
      }
      
      const now = new Date();
      const expiresAt = new Date(this.expiresAt);
      
      // If the token is expired, try to refresh it
      if (now >= expiresAt) {
        return this.refreshAccessToken();
      }
      
      // If expiry is close (within 5 minutes), refresh it proactively
      const fiveMinutes = 5 * 60 * 1000;
      if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
        this.refreshAccessToken();
      }
      
      return true;
    }
  }
});