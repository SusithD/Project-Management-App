// Global auth middleware
import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware for login and auth routes
  if (to.path === '/login' || to.path.startsWith('/auth/')) {
    return;
  }

  // Access the auth store
  const authStore = useAuthStore();
  
  // If user is not authenticated, redirect to login page
  if (!authStore.isAuthenticated) {
    return navigateTo('/login');
  }
});