import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS } from '~/server/utils/schemas';

export default defineEventHandler(async (event) => {
  try {
    // Get user ID from route params
    const id = getRouterParam(event, 'id');
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'User ID is required'
      });
    }

    // Connect to database
    const { db } = await connectToDatabase();
    
    // Delete the user
    const result = await db.collection(COLLECTIONS.USERS).deleteOne({ id: id });
    
    // Check if user was found and deleted
    if (result.deletedCount === 0) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      });
    }
    
    return {
      success: true,
      message: 'User deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to delete user'
    });
  }
});