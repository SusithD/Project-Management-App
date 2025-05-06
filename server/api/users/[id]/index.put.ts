import { ObjectId } from 'mongodb';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS, User } from '~/server/utils/schemas';

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

    // Parse request body
    const body = await readBody(event);
    
    // Connect to database
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTIONS.USERS);
    
    // Prepare update data - exclude _id field
    const { _id, ...updateData } = body;
    
    // Check if email is being updated and if it already exists for another user
    if (updateData.email) {
      const existingUser = await collection.findOne({ 
        email: updateData.email,
        id: { $ne: id } // Exclude the current user
      });
      
      if (existingUser) {
        throw createError({
          statusCode: 409,
          message: 'Email already in use by another user'
        });
      }
    }
    
    // Update user in database
    const result = await collection.updateOne(
      { id: id },
      { $set: updateData }
    );
    
    // Check if document was found and updated
    if (result.matchedCount === 0) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      });
    }
    
    // Fetch the updated user
    const updatedUser = await collection.findOne({ id: id });
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    return createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to update user'
    });
  }
});