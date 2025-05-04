// GET endpoint to fetch a single project by ID
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
    
    // Try to find by numeric ID first
    let project = await collection.findOne({ id: parseInt(id) })
    
    // If not found, try by ObjectId
    if (!project && id.match(/^[0-9a-fA-F]{24}$/)) {
      project = await collection.findOne({ _id: new ObjectId(id) })
    }
    
    if (!project) {
      return createError({
        statusCode: 404,
        statusMessage: 'Project not found'
      })
    }
    
    return project
  } catch (error) {
    console.error('Error fetching project:', error)
    return createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch project'
    })
  }
})