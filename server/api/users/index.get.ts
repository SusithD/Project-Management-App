import { defineEventHandler, createError } from 'h3';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS } from '~/server/utils/schemas';

// This API endpoint returns all users from the organization
export default defineEventHandler(async (event) => {
  try {
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Get all users from the database
    const users = await db.collection(COLLECTIONS.USERS)
      .find()
      .sort({ name: 1 })
      .toArray();
    
    return {
      users,
      total: users.length
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return createError({
      statusCode: 500,
      message: 'Failed to fetch users data'
    });
  }
});