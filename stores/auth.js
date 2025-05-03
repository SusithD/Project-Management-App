<script>
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    role: null, // 'project_member', 'business_analyst', 'admin'
  }),
  
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
    },
    
    clearUser() {
      this.user = null;
      this.isAuthenticated = false;
      this.role = null;
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
</script>