import { seedDemoData, checkDemoDataExists } from '~/server/utils/seed-demo-data';
import { isDemoMode } from '~/server/utils/demo-mode';

export default defineNitroPlugin(async (nitroApp) => {
  // Only run in demo mode
  if (!isDemoMode()) {
    console.log('[DEMO PLUGIN] Demo mode is disabled, skipping demo data initialization');
    return;
  }
  
  console.log('[DEMO PLUGIN] Demo mode is enabled, checking demo data...');
  
  try {
    // Check if demo data already exists
    const existingData = await checkDemoDataExists();
    
    if (existingData.usersExist && existingData.projectsExist) {
      console.log('[DEMO PLUGIN] Demo data already exists, skipping initialization');
      console.log(`[DEMO PLUGIN] Found ${existingData.userCount} demo users and ${existingData.projectCount} demo projects`);
      return;
    }
    
    console.log('[DEMO PLUGIN] Demo data not found, initializing...');
    
    // Seed demo data
    await seedDemoData();
    
    console.log('[DEMO PLUGIN] Demo data initialization completed successfully');
  } catch (error) {
    console.error('[DEMO PLUGIN] Error initializing demo data:', error);
  }
});
