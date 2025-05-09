import { defineStore } from 'pinia';
import { useNotificationsStore } from './notifications';

export const useUsersStore = defineStore('users', {
  state: () => ({
    users: [],
    loading: false,
    error: null
  }),

  getters: {
    // Get all users sorted by name
    allUsers: (state) => {
      return [...state.users].sort((a, b) => 
        a.name?.localeCompare(b.name)
      );
    },

    // Get users by role
    getUsersByRole: (state) => (role) => {
      if (!role) return state.users;
      return state.users.filter(user => user.role === role);
    },

    // Get developers (useful for assigning to projects)
    developers: (state) => {
      return state.users.filter(user => 
        user.role === 'Developer' || user.role === 'Lead Developer'
      );
    },

    // Get available developers
    availableDevelopers: (state) => {
      return state.users.filter(user => 
        (user.role === 'Developer' || user.role === 'Lead Developer') &&
        user.availability?.status === 'available'
      );
    },

    // Get partially available developers
    partiallyAvailableDevelopers: (state) => {
      return state.users.filter(user => 
        (user.role === 'Developer' || user.role === 'Lead Developer') &&
        user.availability?.status === 'partially_available'
      );
    },

    // Get users by department
    getUsersByDepartment: (state) => (department) => {
      return state.users.filter(user => user.department === department);
    },

    // Get user by ID
    getUserById: (state) => (id) => {
      return state.users.find(user => user.id === id);
    },

    // Get user by email
    getUserByEmail: (state) => (email) => {
      return state.users.find(user => user.email?.toLowerCase() === email?.toLowerCase());
    },

    // Get user display name by ID
    getUserDisplayName: (state) => (id) => {
      const user = state.users.find(user => user.id === id);
      return user ? user.name : 'Unknown User';
    },
    
    // Get user email by ID
    getUserEmail: (state) => (id) => {
      const user = state.users.find(user => user.id === id);
      return user ? user.email : '';
    },

    // Get user availability by ID
    getUserAvailability: (state) => (id) => {
      const user = state.users.find(user => user.id === id);
      return user?.availability || { status: 'available' };
    },

    getNonDevelopers: (state) => {
      return state.users.filter(user => user.role !== 'Developer');
    }
  },

  actions: {
    // Fetch all users from the API
    async fetchUsers() {
      const notifications = useNotificationsStore();
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch('/api/users/');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.users) {
          this.users = data.users;
          return this.users;
        } else {
          throw new Error('Failed to fetch users: Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        this.error = error.message;
        notifications.error('Failed to load organization users');
        return [];
      } finally {
        this.loading = false;
      }
    },
    
    async fetchUserById(id) {
      if (!id) return null;
      
      // Check if we already have this user
      const existingUser = this.getUserById(id);
      if (existingUser) return existingUser;
      
      try {
        const { data } = await useFetch(`/api/users/${id}`);
        if (data.value) {
          // Add to users if not already there
          if (!this.users.some(user => user.id === data.value.id)) {
            this.users.push(data.value);
          }
          return data.value;
        }
        return null;
      } catch (error) {
        console.error(`Error fetching user ${id}:`, error);
        return null;
      }
    },
    
    // Format user for display in select dropdowns
    formatUserForSelect(user) {
      if (!user) return { value: '', label: 'Unknown User' };
      
      // If user has an email, include it in the label
      const label = user.email 
        ? `${user.name} (${user.email})`
        : user.name;
        
      return {
        value: user.id,
        label: label,
        availability: user.availability
      };
    },
    
    // Get all users formatted for select dropdowns
    getUsersForSelect() {
      return this.allUsers.map(user => this.formatUserForSelect(user));
    },
    
    // Get developers formatted for select dropdowns
    getDevelopersForSelect() {
      return this.developers.map(user => this.formatUserForSelect(user));
    },
    
    // Update user availability status
    async updateUserAvailability(userId, availabilityData) {
      const notifications = useNotificationsStore();
      
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            availability: availabilityData 
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update availability: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Update user in the store
        const index = this.users.findIndex(u => u.id === userId);
        if (index !== -1) {
          this.users[index] = {
            ...this.users[index],
            availability: availabilityData
          };
        }
        
        notifications.success('User availability updated successfully');
        return data;
      } catch (error) {
        console.error('Error updating user availability:', error);
        notifications.error('Failed to update user availability');
        throw error;
      }
    }
  }
});