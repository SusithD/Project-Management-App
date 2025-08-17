// Global auth middleware
import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to) => {
  // Check if we're in demo mode
  const config = useRuntimeConfig();
  const isDemoMode = config.public.demoMode === true;
  
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
      const demoUser = localStorage.getItem('demo-user');
      if (!demoUser && to.path !== '/demo-login') {
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

  // Define route-based access control
  const routePermissions: Record<string, { resource: string; action: string }> = {
    '/dashboard': { resource: 'projects', action: 'read' },
    '/projects': { resource: 'projects', action: 'read' },
    '/users': { resource: 'users', action: 'read' },
    '/settings': { resource: 'users', action: 'update' }, // Only managers and above
    '/reports': { resource: 'reports', action: 'read' },
    '/tasks': { resource: 'tasks', action: 'read' },
  };

  // Check if current route requires specific permissions
  const routePermission = routePermissions[to.path];
  if (routePermission) {
    if (!authStore.hasPermission(routePermission.resource, routePermission.action)) {
      // User doesn't have permission, redirect to dashboard with error
      throw createError({
        statusCode: 403,
        statusMessage: `Access denied. You don't have permission to access this page.`
      });
    }
  }

  // Special route restrictions
  if (to.path.startsWith('/settings') && !authStore.isManager && !authStore.isSuperAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Settings access is restricted to managers and administrators.'
    });
  }
});