// Middleware to handle authentication
import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware for login, auth routes, and admin pages
  if (to.path === '/login' || 
      to.path.startsWith('/auth/') ||
      to.path.startsWith('/admin/')) {
    return;
  }

  // Access the auth store
  const authStore = useAuthStore();
  
  // If user is not authenticated, redirect to login page
  if (!authStore.isAuthenticated) {
    return navigateTo('/login');
  }
});