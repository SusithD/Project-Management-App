// DELETE endpoint to remove a project by ID
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '~/server/utils/database'
import { COLLECTIONS } from '~/server/utils/schemas'

export default defineEventHandler(async (event) => {
  try {
    // Get project ID from the route parameter
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      return createError({
        statusCode: 400,
        statusMessage: 'Project ID is required'
      })
    }
    
    // Connect to database
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTIONS.PROJECTS)
    
    // Create possible queries to find the project
    const queries = [];
    
    // Try MongoDB ObjectId (most common for MongoDB _id fields)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        queries.push({ _id: new ObjectId(id) });
      } catch (err) {
        console.log('Invalid ObjectId format, trying other methods');
      }
    }
    
    // Add numeric ID query
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      queries.push({ id: numericId });
    }
    
    // Add string ID query as fallback
    queries.push({ id: id });
    
    // Try each query until we find the project
    let project = null;
    for (const query of queries) {
      project = await collection.findOne(query);
      if (project) break;
    }
    
    // If no project found, return 404
    if (!project) {
      console.log(`Project not found with ID: ${id}, tried queries:`, queries);
      return createError({
        statusCode: 404,
        statusMessage: 'Project not found'
      });
    }
    
    // Now delete the project using the same query that found it
    const deleteQuery = project._id ? { _id: project._id } : { id: project.id };
    const result = await collection.deleteOne(deleteQuery);
    
    if (result.deletedCount === 0) {
      console.log(`Failed to delete project with query:`, deleteQuery);
      return createError({
        statusCode: 500,
        statusMessage: 'Failed to delete project'
      });
    }
    
    return {
      success: true,
      message: 'Project deleted successfully',
      deletedProject: project
    };
  } catch (error) {
    console.error('Error deleting project:', error);
    return createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to delete project'
    });
  }
});