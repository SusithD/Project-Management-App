import { defineEventHandler, createError } from 'h3';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS } from '~/server/utils/schemas';

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  if (!id) {
    return createError({
      statusCode: 400,
      message: 'User ID is required'
    });
  }

  try {
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Get the user from the database
    const user = await db.collection(COLLECTIONS.USERS).findOne({ id });

    if (!user) {
      return createError({
        statusCode: 404,
        message: `User with ID ${id} not found`
      });
    }

    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return createError({
      statusCode: 500,
      message: 'Failed to fetch user data'
    });
  }
});