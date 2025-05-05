import { ObjectId } from 'mongodb'
// Import auth from Nuxt
import { useRuntimeConfig } from '#imports'
import { connectToDatabase } from '~/server/utils/database'
import { COLLECTIONS } from '~/server/utils/schemas'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication using headers instead of getServerSession
    const authHeader = getRequestHeader(event, 'Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      });
    }

    // Get project ID from route params
    const id = getRouterParam(event, 'id');
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      });
    }

    // Parse request body
    const body = await readBody(event);
    
    // Connect to database
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTIONS.PROJECTS)
    
    // Prepare update data - exclude _id field
    const { _id, ...updateData } = body;
    
    // Current date for lastUpdated
    const currentDate = new Date().toISOString().split('T')[0]
    updateData.lastUpdated = currentDate;
    
    // Search by numeric ID or MongoDB ObjectId
    let query;
    try {
      // Try to convert to ObjectId
      query = { _id: new ObjectId(id) };
    } catch (err) {
      // If not a valid ObjectId, search by numeric id
      query = { id: parseInt(id) };
    }
    
    // Update project in database
    const result = await collection.updateOne(
      query,
      { $set: updateData }
    );
    
    // Check if document was found and updated
    if (result.matchedCount === 0) {
      throw createError({
        statusCode: 404,
        message: 'Project not found'
      });
    }
    
    // Fetch the updated project
    const updatedProject = await collection.findOne(query);
    
    return updatedProject;
  } catch (error) {
    console.error('Error updating project:', error);
    return createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to update project'
    });
  }
});
