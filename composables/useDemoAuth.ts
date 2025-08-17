import { ref, computed } from 'vue';

// Demo authentication composable
export const useDemoAuth = () => {
  const currentUser = ref(null);
  const isLoading = ref(false);

  // Check if user is authenticated (client-side only)
  const isAuthenticated = computed(() => {
    if (process.server) return false; // Always false on server-side
    
    const user = getCurrentUser();
    return !!user;
  });

  // Get current user from localStorage
  const getCurrentUser = () => {
    if (process.server) return null;
    
    try {
      const stored = localStorage.getItem('demo-user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing demo user:', error);
      return null;
    }
  };

  // Login with demo user
  const login = async (email: string) => {
    isLoading.value = true;
    
    try {
      const { DEMO_USERS } = useDemoData();
      const user = DEMO_USERS.find(u => u.email === email);
      
      if (!user) {
        throw new Error('Demo user not found');
      }

      // Store user in localStorage (client-side only)
      if (process.client) {
        localStorage.setItem('demo-user', JSON.stringify(user));
        localStorage.setItem('demo-login-time', new Date().toISOString());
      }
      
      currentUser.value = user;
      
      // Redirect to dashboard
      await navigateTo('/dashboard');
      
      return user;
    } catch (error) {
      console.error('Demo login error:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // Logout
  const logout = async () => {
    if (process.client) {
      localStorage.removeItem('demo-user');
      localStorage.removeItem('demo-login-time');
    }
    
    currentUser.value = null;
    await navigateTo('/demo-login');
  };

  // Initialize user on client-side
  const initializeUser = () => {
    if (process.client) {
      const user = getCurrentUser();
      if (user) {
        currentUser.value = user;
      }
    }
  };

  // Auto-initialize when composable is used
  if (process.client) {
    initializeUser();
  }

  return {
    currentUser: computed(() => currentUser.value || getCurrentUser()),
    isAuthenticated,
    isLoading,
    login,
    logout,
    initializeUser
  };
};