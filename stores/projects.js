import { defineStore } from 'pinia';

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
    async fetchProjects() {
      this.isLoading = true;
      this.error = null;
      
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll use a timeout and mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.projects = [
          { 
            id: 1, 
            name: 'Website Redesign', 
            status: 'Ongoing', 
            progress: 75, 
            assignedTo: 'John Doe',
            startDate: '2023-10-15',
            endDate: '2024-05-30',
            lastUpdated: '2024-04-22',
            remarks: 'Frontend development is 80% complete. Backend integration to start next week.',
            notes: 'Client requested additional features for the user dashboard. Need to adjust timeline.'
          },
          { 
            id: 2, 
            name: 'Mobile App Development', 
            status: 'Ongoing', 
            progress: 45, 
            assignedTo: 'Jane Smith',
            startDate: '2024-01-10',
            endDate: '2024-07-15',
            lastUpdated: '2024-04-20',
            remarks: 'UI design completed. Development in progress.',
            notes: 'Need to follow up with client regarding app store requirements.'
          },
          // ...more projects
        ];
      } catch (error) {
        this.error = error.message || 'Failed to fetch projects';
        console.error('Error fetching projects:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    // Fetch a single project by ID
    async fetchProjectById(id) {
      this.isLoading = true;
      this.error = null;
      
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll use a timeout and mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const foundProject = this.projects.find(p => p.id === Number(id));
        
        if (foundProject) {
          this.currentProject = foundProject;
        } else {
          throw new Error('Project not found');
        }
      } catch (error) {
        this.error = error.message || 'Failed to fetch project';
        console.error('Error fetching project:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    // Create a new project
    async createProject(projectData) {
      this.isLoading = true;
      this.error = null;
      
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll use a timeout and mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newProject = {
          id: this.projects.length + 1,
          ...projectData,
          lastUpdated: new Date().toISOString().split('T')[0]
        };
        
        this.projects.push(newProject);
        return newProject;
      } catch (error) {
        this.error = error.message || 'Failed to create project';
        console.error('Error creating project:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    // Update an existing project
    async updateProject(id, projectData) {
      this.isLoading = true;
      this.error = null;
      
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll use a timeout and mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const index = this.projects.findIndex(p => p.id === Number(id));
        
        if (index !== -1) {
          this.projects[index] = {
            ...this.projects[index],
            ...projectData,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
          
          if (this.currentProject && this.currentProject.id === Number(id)) {
            this.currentProject = this.projects[index];
          }
          
          return this.projects[index];
        } else {
          throw new Error('Project not found');
        }
      } catch (error) {
        this.error = error.message || 'Failed to update project';
        console.error('Error updating project:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    // Delete a project
    async deleteProject(id) {
      this.isLoading = true;
      this.error = null;
      
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll use a timeout and mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const index = this.projects.findIndex(p => p.id === Number(id));
        
        if (index !== -1) {
          this.projects.splice(index, 1);
          
          if (this.currentProject && this.currentProject.id === Number(id)) {
            this.currentProject = null;
          }
          
          return true;
        } else {
          throw new Error('Project not found');
        }
      } catch (error) {
        this.error = error.message || 'Failed to delete project';
        console.error('Error deleting project:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    }
  }
});