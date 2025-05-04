// PUT endpoint to update a project by ID
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '~/server/utils/database'
import { COLLECTIONS, Project } from '~/server/utils/schemas'

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
    
    // Parse request body
    const body = await readBody(event)
    
    // Connect to database
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTIONS.PROJECTS)
    
    // Current date for lastUpdated timestamp
    const currentDate = new Date().toISOString().split('T')[0]
    
    // Create update document with lastUpdated timestamp
    const updateDoc = {
      ...body,
      lastUpdated: currentDate
    }
    
    // Remove _id field if present (cannot be updated)
    if (updateDoc._id) {
      delete updateDoc._id
    }
    
    // Try to update by numeric ID first
    let result = await collection.findOneAndUpdate(
      { id: parseInt(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    )
    
    // If not found by numeric ID, try to update by MongoDB ObjectId
    if (!result?.value && id.match(/^[0-9a-fA-F]{24}$/)) {
      result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateDoc },
        { returnDocument: 'after' }
      )
    }
    
    // If project is still not found, return a 404
    if (!result?.value) {
      return createError({
        statusCode: 404,
        statusMessage: 'Project not found'
      })
    }
    
    // Return the updated project
    return result.value
  } catch (error) {
    console.error('Error updating project:', error)
    return createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to update project'
    })
  }
})