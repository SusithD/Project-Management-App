import { defineEventHandler } from 'h3';
import { isDemoMode, isDemoUserEmail } from '~/server/utils/demo-mode';
import { DEMO_USERS, DEMO_PROJECTS } from '~/server/utils/demo-data';

/**
 * Test demo data endpoint
 * 
 * @route GET /api/demo/test
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const userEmail = query.userEmail as string;
    
    const demoMode = isDemoMode();
    const isDemoUser = userEmail && isDemoUserEmail(userEmail);
    
    return {
      success: true,
      demoMode,
      isDemoUser,
      userEmail,
      demoUsersCount: DEMO_USERS.length,
      demoProjectsCount: DEMO_PROJECTS.length,
      message: demoMode && isDemoUser 
        ? 'Demo mode is active and user is a demo user' 
        : demoMode 
          ? 'Demo mode is active but user is not a demo user' 
          : 'Demo mode is not active'
    };
  } catch (error) {
    console.error('[DEMO TEST API] Error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to test demo data'
    });
  }
});
