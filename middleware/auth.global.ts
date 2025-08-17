// Global auth middleware
import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  // Get runtime config to check demo mode
  const config = useRuntimeConfig();
  const isDemoMode = config.public.demoMode === true;
  
  console.log('Auth middleware - Demo mode:', isDemoMode, 'Route:', to.path);
  
  // In demo mode, redirect original login/auth routes to demo login
  if (isDemoMode) {
    const disabledRoutes = [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/auth/microsoft',
      '/oauth/callback'
    ];
    
    if (disabledRoutes.includes(to.path)) {
      console.log('Redirecting to demo login from:', to.path);
      return navigateTo('/demo-login');
    }
    
    // Skip middleware for demo login and test pages
    if (to.path === '/demo-login' || to.path === '/test-demo' || to.path.startsWith('/auth/')) {
      return;
    }

    // Skip middleware for admin demo pages (these are for testing/debugging)
    if (to.path.startsWith('/admin/auth-demo') || to.path.startsWith('/admin/roles') || to.path.startsWith('/admin/email-mappings')) {
      return;
    }
    
    // For demo mode, check authentication using localStorage (client-side only)
    if (process.client) {
      const authStore = useAuthStore();
      
      // If user is not authenticated in demo mode, redirect to demo login
      if (!authStore.isAuthenticated && to.path !== '/demo-login') {
        console.log('Demo mode: User not authenticated, redirecting to demo login');
        return navigateTo('/demo-login');
      }
      
      // Validate demo session
      if (authStore.isAuthenticated && !authStore.validateSession()) {
        console.log('Demo mode: Session invalid, clearing and redirecting to demo login');
        authStore.clearUser();
        return navigateTo('/demo-login');
      }
    }
    
    // Skip regular auth checks in demo mode
    return;
  }

  // Skip middleware for demo login and test pages in production mode
  if (to.path === '/demo-login' || to.path === '/test-demo' || to.path.startsWith('/auth/')) {
    return;
  }

  // Skip middleware for admin demo pages (these are for testing/debugging)
  if (to.path.startsWith('/admin/auth-demo') || to.path.startsWith('/admin/roles') || to.path.startsWith('/admin/email-mappings')) {
    return;
  }

  // Regular production auth logic
  const authStore = useAuthStore();
  
  // If user is not authenticated, redirect to login page
  if (!authStore.isAuthenticated) {
    return navigateTo('/login');
  }

  // Validate session in production mode
  if (!authStore.validateSession()) {
    console.log('Production mode: Session invalid, redirecting to login');
    authStore.clearUser();
    return navigateTo('/login');
  }

  // Define route-based access control
  const protectedRoutes = {
    '/admin': ['SUPER_ADMIN', 'MANAGER'],
    '/users': ['SUPER_ADMIN', 'MANAGER', 'HR'],
    '/reports': ['SUPER_ADMIN', 'MANAGER', 'BUSINESS_ANALYST']
  };

  // Check if current route requires specific roles
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (to.path.startsWith(route) && !allowedRoles.includes(authStore.role)) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied. Insufficient permissions.'
      });
    }
  }
});