import { defineEventHandler } from 'h3';
import { resetDemoData, checkDemoDataExists } from '~/server/utils/seed-demo-data';

/**
 * Reset demo data endpoint
 * 
 * @route POST /api/demo/reset
 */
export default defineEventHandler(async (event) => {
  try {
    console.log('[DEMO API] Resetting demo data...');
    
    // Reset demo data
    await resetDemoData();
    
    // Check the result
    const result = await checkDemoDataExists();
    
    return {
      success: true,
      message: 'Demo data reset successfully',
      data: result
    };
  } catch (error) {
    console.error('[DEMO API] Error resetting demo data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to reset demo data'
    });
  }
});
