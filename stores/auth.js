import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => {
    // Try to load state from localStorage on initialization
    const savedState = process.client ? JSON.parse(localStorage.getItem('auth_state') || 'null') : null;
    
    return {
      user: savedState?.user || null,
      isAuthenticated: savedState?.isAuthenticated || false,
      role: savedState?.role || null, // 'project_member', 'business_analyst', 'admin'
    };
  },
  
  getters: {
    isAdmin: (state) => state.role === 'admin',
    isBusinessAnalyst: (state) => state.role === 'business_analyst',
    isProjectMember: (state) => state.role === 'project_member',
    userFullName: (state) => state.user?.displayName || 'User',
    userEmail: (state) => state.user?.mail || state.user?.userPrincipalName || '',
  },
  
  actions: {
    setUser(user) {
      this.user = user;
      this.isAuthenticated = true;
      
      // In a real app, you would fetch the role from your backend
      // For now, we'll set a default role
      this.role = 'business_analyst';
      
      // Persist state to localStorage
      if (process.client) {
        localStorage.setItem('auth_state', JSON.stringify({
          user: this.user,
          isAuthenticated: this.isAuthenticated,
          role: this.role
        }));
      }
    },
    
    clearUser() {
      this.user = null;
      this.isAuthenticated = false;
      this.role = null;
      
      // Clear persisted state
      if (process.client) {
        localStorage.removeItem('auth_state');
      }
    },
    
    // Complete the authentication process after OAuth redirect
    async completeAuthentication(authCode) {
      try {
        console.log('Auth code received:', authCode);
        
        // In a real implementation, you would:
        // 1. Exchange the auth code for tokens
        // 2. Call your backend to validate the token and get user info
        
        // For now, we'll simulate a successful authentication
        const mockUser = {
          id: 'user123',
          displayName: 'Demo User',
          userPrincipalName: 'demo.user@example.com',
          mail: 'demo.user@example.com'
        };
        
        // In a production app, make an API call to exchange code for tokens
        // Example:
        // if (authCode) {
        //   const tokenResponse = await $fetch('/api/auth/token', {
        //     method: 'POST',
        //     body: { code: authCode }
        //   });
        //   
        //   // Store tokens securely
        //   localStorage.setItem('access_token', tokenResponse.accessToken);
        //   
        //   // Get user info
        //   const userInfo = await $fetch('/api/auth/me', {
        //     headers: {
        //       Authorization: `Bearer ${tokenResponse.accessToken}`
        //     }
        //   });
        //   
        //   this.setUser(userInfo);
        // }
        
        this.setUser(mockUser);
        return true;
      } catch (error) {
        console.error('Failed to complete authentication:', error);
        this.clearUser();
        throw error;
      }
    },
    
    // Check if user has permission to perform an action
    hasPermission(action, resourceId = null) {
      if (!this.isAuthenticated) return false;
      
      switch (action) {
        case 'view_all_projects':
          return this.isAdmin || this.isBusinessAnalyst;
          
        case 'edit_project':
          // Admin and business analyst can edit any project
          if (this.isAdmin || this.isBusinessAnalyst) return true;
          // Project members can only edit their assigned projects
          return this.isProjectMember && this.isAssignedToProject(resourceId);
          
        case 'create_project':
          return this.isAdmin || this.isBusinessAnalyst;
          
        case 'delete_project':
          return this.isAdmin;
          
        case 'manage_users':
          return this.isAdmin;
          
        default:
          return false;
      }
    },
    
    // Check if user is assigned to a project
    isAssignedToProject(projectId) {
      // In a real app, you would check against your backend data
      // For demo purposes, we'll return true
      return true;
    }
  }
});