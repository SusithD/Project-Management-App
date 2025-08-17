// Demo mode detection composable
export const useDemoMode = () => {
  const config = useRuntimeConfig();
  
  const isDemoMode = computed(() => {
    return config.public.demoMode === true || 
           process.env.DEMO_MODE === 'true';
  });
  
  const getDemoRedirectUrl = () => '/demo-login';
  
  const redirectToDemo = () => {
    if (process.client) {
      navigateTo('/demo-login');
    }
  };
  
  return {
    isDemoMode,
    getDemoRedirectUrl,
    redirectToDemo
  };
};