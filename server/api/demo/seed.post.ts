import { defineEventHandler } from 'h3';
import { seedDemoData, checkDemoDataExists } from '~/server/utils/seed-demo-data';

/**
 * Seed demo data endpoint
 * 
 * @route POST /api/demo/seed
 */
export default defineEventHandler(async (event) => {
  try {
    console.log('[DEMO API] Seeding demo data...');
    
    // Check if demo data already exists
    const existingData = await checkDemoDataExists();
    
    if (existingData.usersExist && existingData.projectsExist) {
      return {
        success: true,
        message: 'Demo data already exists',
        data: existingData
      };
    }
    
    // Seed demo data
    await seedDemoData();
    
    // Check the result
    const result = await checkDemoDataExists();
    
    return {
      success: true,
      message: 'Demo data seeded successfully',
      data: result
    };
  } catch (error) {
    console.error('[DEMO API] Error seeding demo data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to seed demo data'
    });
  }
});
