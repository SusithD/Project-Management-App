import { defineEventHandler, createError } from 'h3';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS } from '~/server/utils/schemas';
import { isDemoMode, getDemoUserFromRequest } from '~/server/utils/demo-mode';
import { DEMO_USERS } from '~/server/utils/demo-data';

// This API endpoint returns all users from the organization
export default defineEventHandler(async (event) => {
  try {
    // Check if demo mode is enabled
    const demoMode = isDemoMode();
    
    // Get user email from query parameter (sent by client)
    const query = getQuery(event);
    const userEmail = query.userEmail as string;
    
    // Check if current user is a demo user
    const isDemoUser = userEmail && isDemoUserEmail(userEmail);
    
    if (demoMode && isDemoUser) {
      // Return demo users
      return {
        users: DEMO_USERS,
        total: DEMO_USERS.length,
        demoMode: true
      };
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Get all users from the database
    const users = await db.collection(COLLECTIONS.USERS)
      .find()
      .sort({ name: 1 })
      .toArray();
    
    return {
      users,
      total: users.length,
      demoMode: false
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return createError({
      statusCode: 500,
      message: 'Failed to fetch users data'
    });
  }
});