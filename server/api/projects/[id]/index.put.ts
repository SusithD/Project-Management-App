// PUT endpoint to update a project by ID
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '~/server/utils/database'
import { COLLECTIONS } from '~/server/utils/schemas'

export default defineEventHandler(async (event) => {
  try {
    // Get project ID from route parameter
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
    
    // Add lastUpdated timestamp
    const updateDoc = {
      ...body,
      lastUpdated: new Date().toISOString().split('T')[0]
    }
    
    // Remove _id field if present (cannot be updated)
    delete updateDoc._id
    
    // Try to update by numeric ID first
    let result = await collection.findOneAndUpdate(
      { id: parseInt(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    )
    
    // If not found, try by ObjectId
    if (!result?.value && id.match(/^[0-9a-fA-F]{24}$/)) {
      result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateDoc },
        { returnDocument: 'after' }
      )
    }
    
    if (!result?.value) {
      return createError({
        statusCode: 404,
        statusMessage: 'Project not found'
      })
    }
    
    return result.value
  } catch (error) {
    console.error('Error updating project:', error)
    return createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to update project'
    })
  }
})