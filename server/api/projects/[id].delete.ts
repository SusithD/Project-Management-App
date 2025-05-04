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
    
    // Try to delete by numeric ID first
    let result = await collection.findOneAndDelete({ id: parseInt(id) })
    
    // If not found, try by ObjectId
    if (!result?.value && id.match(/^[0-9a-fA-F]{24}$/)) {
      result = await collection.findOneAndDelete({ _id: new ObjectId(id) })
    }
    
    if (!result?.value) {
      return createError({
        statusCode: 404,
        statusMessage: 'Project not found'
      })
    }
    
    return {
      success: true,
      message: 'Project deleted successfully',
      deletedProject: result.value
    }
  } catch (error) {
    console.error('Error deleting project:', error)
    return createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to delete project'
    })
  }
})