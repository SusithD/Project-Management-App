import { defineStore } from 'pinia';
import { useNotificationsStore } from '~/stores/notifications';
import { useAuthStore } from '~/stores/auth';

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    isLoading: false,
    error: null,
    currentProject: null
  }),
  
  getters: {
    ongoingProjects: (state) => state.projects.filter(p => p.status === 'Ongoing'),
    completedProjects: (state) => state.projects.filter(p => p.status === 'Completed'),
    onHoldProjects: (state) => state.projects.filter(p => p.status === 'On Hold'),
    projectsCount: (state) => state.projects.length,
    ongoingCount: (state) => state.ongoingProjects.length,
    completedCount: (state) => state.completedProjects.length,
    onHoldCount: (state) => state.onHoldProjects.length,
    
    // Get projects by assignee
    getProjectsByAssignee: (state) => (assignee) => {
      return state.projects.filter(p => p.assignedTo === assignee);
    },
    
    // Search projects
    searchProjects: (state) => (query, filters = {}) => {
      return state.projects.filter(project => {
        // Apply search query
        const matchesQuery = !query || 
          project.name.toLowerCase().includes(query.toLowerCase()) ||
          project.remarks?.toLowerCase().includes(query.toLowerCase());
        
        // Apply status filter
        const matchesStatus = !filters.status || filters.status === 'all' || 
          project.status === filters.status;
        
        // Apply assignee filter
        const matchesAssignee = !filters.assignee || filters.assignee === 'all' || 
          project.assignedTo === filters.assignee;
        
        // Apply date range filter if provided
        let matchesDateRange = true;
        if (filters.startDate && filters.endDate) {
          const projectStart = new Date(project.startDate);
          const projectEnd = new Date(project.endDate);
          const filterStart = new Date(filters.startDate);
          const filterEnd = new Date(filters.endDate);
          
          matchesDateRange = (projectStart >= filterStart && projectStart <= filterEnd) ||
                            (projectEnd >= filterStart && projectEnd <= filterEnd);
        }
        
        return matchesQuery && matchesStatus && matchesAssignee && matchesDateRange;
      });
    }
  },
  
  actions: {
    // Fetch all projects
    async fetchProjects(filters = {}) {
      this.isLoading = true;
      this.error = null;
      const notificationsStore = useNotificationsStore();
      const authStore = useAuthStore();
      
      try {
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
        if (filters.assignee && filters.assignee !== 'all') queryParams.append('assignee', filters.assignee);
        if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
        if (filters.priority && filters.priority !== 'all') queryParams.append('priority', filters.priority);
        
        // Add user email for demo mode detection
        if (authStore.userEmail) {
          queryParams.append('userEmail', authStore.userEmail);
        }
        
        // Modify fetchProjects to include demo projects
        if (authStore.isDemoMode) {
          queryParams.append('demo', 'true');
        }
        
        // Make API call to fetch projects
        const queryString = queryParams.toString();
        const url = `/api/projects${queryString ? '?' + queryString : ''}`;
        
        const { data } = await useFetch(url, {
          headers: {
            'Authorization': authStore.authHeader
          }
        });
        // Fix: Extract just the projects array from the response
        this.projects = data.value?.projects || [];
      } catch (error) {
        this.error = error.message || 'Failed to fetch projects';
        console.error('Error fetching projects:', error);
        notificationsStore.error('Failed to load projects. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    
    // Fetch a single project by ID
    async fetchProjectById(id) {
      this.isLoading = true;
      this.error = null;
      const notificationsStore = useNotificationsStore();
      const authStore = useAuthStore();
      
      try {
        // Modify fetchProjectById to handle demo projects
        if (authStore.isDemoMode) {
          const demoProject = DEMO_PROJECTS.find(p => p.id === Number(id) || p.id.toString() === id);
          if (demoProject) {
            this.currentProject = demoProject;
            return;
          }
        }
        
        // Make API call to fetch a single project
        const { data, error } = await useFetch(`/api/projects/${id}`, {
          headers: {
            'Authorization': authStore.authHeader
          }
        });
        
        if (error.value) {
          throw new Error(error.value.message || 'Failed to fetch project');
        }
        
        if (data.value) {
          this.currentProject = data.value;
        } else {
          throw new Error('Project not found');
        }
      } catch (error) {
        this.error = error.message || 'Failed to fetch project';
        console.error('Error fetching project:', error);
        notificationsStore.error('Failed to load project details. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    
    // Create a new project
    async createProject(projectData) {
      this.isLoading = true;
      this.error = null;
      const notificationsStore = useNotificationsStore();
      const authStore = useAuthStore();
      
      try {
        // Make API call to create a new project
        const { data, error } = await useFetch('/api/projects', {
          method: 'POST',
          body: projectData,
          headers: {
            'Authorization': authStore.authHeader
          }
        });
        
        if (error.value) {
          throw new Error(error.value.message || 'Failed to create project');
        }
        
        if (data.value) {
          // Add the new project to the local state
          this.projects.push(data.value);
          notificationsStore.success(`Project "${data.value.name}" created successfully`);
          return data.value;
        } else {
          throw new Error('Failed to create project');
        }
      } catch (error) {
        this.error = error.message || 'Failed to create project';
        console.error('Error creating project:', error);
        notificationsStore.error('Failed to create project. Please try again.');
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    // Update an existing project
    async updateProject(id, projectData) {
      this.isLoading = true;
      this.error = null;
      const notificationsStore = useNotificationsStore();
      const authStore = useAuthStore();
      
      try {
        // Make API call to update the project
        const { data, error } = await useFetch(`/api/projects/${id}`, {
          method: 'PUT',
          body: projectData,
          headers: {
            'Authorization': authStore.authHeader
          }
        });
        
        if (error.value) {
          throw new Error(error.value.message || 'Failed to update project');
        }
        
        if (data.value) {
          // Update the project in the local state
          const index = this.projects.findIndex(p => p.id === Number(id) || p._id === id);
          
          if (index !== -1) {
            this.projects[index] = data.value;
          }
          
          // Update currentProject if it's the same project
          if (this.currentProject && (this.currentProject.id === Number(id) || this.currentProject._id === id)) {
            this.currentProject = data.value;
          }
          
          notificationsStore.success(`Project "${data.value.name}" updated successfully`);
          return data.value;
        } else {
          throw new Error('Project not found');
        }
      } catch (error) {
        this.error = error.message || 'Failed to update project';
        console.error('Error updating project:', error);
        notificationsStore.error('Failed to update project. Please try again.');
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    // Delete a project
    async deleteProject(id) {
      this.isLoading = true;
      this.error = null;
      const notificationsStore = useNotificationsStore();
      const authStore = useAuthStore();
      
      try {
        // Get project before attempting to delete it
        const projectToDelete = this.projects.find(p => 
          p.id?.toString() === id?.toString() || 
          p._id?.toString() === id?.toString()
        );
        
        const projectName = projectToDelete ? projectToDelete.name : 'Project';
        
        // Make API call to delete the project
        const { data, error } = await useFetch(`/api/projects/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': authStore.authHeader
          }
        });
        
        // Remove project from local state regardless of server response
        // This handles the race condition where the server has deleted the project
        // but may have returned a 404 due to timing issues
        const index = this.projects.findIndex(p => 
          p.id?.toString() === id?.toString() || 
          p._id?.toString() === id?.toString()
        );
        
        if (index !== -1) {
          this.projects.splice(index, 1);
          
          // Clear currentProject if it's the same project
          if (this.currentProject && 
              (this.currentProject.id?.toString() === id?.toString() || 
               this.currentProject._id?.toString() === id?.toString())) {
            this.currentProject = null;
          }
          
          notificationsStore.success(`${projectName} has been deleted successfully`);
          return true;
        }
        
        // If we reach here and there was an error but we didn't find a project to delete locally
        if (error.value) {
          console.warn('Server reported error but project may have been deleted:', error.value);
          // Don't throw an error if we couldn't find the project locally either
          // as it's likely already been deleted
          if (!projectToDelete) {
            notificationsStore.info('Project already deleted or not found');
            return true;
          }
          throw new Error(error.value.message || 'Failed to delete project');
        }
        
        // If no project was found locally but server reported success
        if (data.value && data.value.success) {
          notificationsStore.success(`Project was deleted successfully`);
          return true;
        } else {
          // This should rarely happen - project not found locally or on server
          throw new Error('Project not found');
        }
      } catch (error) {
        this.error = error.message || 'Failed to delete project';
        console.error('Error deleting project:', error);
        notificationsStore.error('Failed to delete project. Please try again.');
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  }
});