import { defineEventHandler } from 'h3';
import { checkDemoDataExists } from '~/server/utils/seed-demo-data';
import { isDemoMode } from '~/server/utils/demo-mode';

/**
 * Get demo data status endpoint
 * 
 * @route GET /api/demo/status
 */
export default defineEventHandler(async (event) => {
  try {
    console.log('[DEMO API] Checking demo data status...');
    
    const demoDataStatus = await checkDemoDataExists();
    const demoModeEnabled = isDemoMode();
    
    return {
      success: true,
      demoMode: demoModeEnabled,
      data: demoDataStatus,
      message: demoModeEnabled ? 'Demo mode is enabled' : 'Demo mode is disabled'
    };
  } catch (error) {
    console.error('[DEMO API] Error checking demo data status:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to check demo data status'
    });
  }
});
