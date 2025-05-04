import { defineEventHandler, getRouterParam, createError, readBody } from 'h3'
import { connectToDatabase } from '~/server/utils/database'
import { ObjectId } from 'mongodb'
import { randomUUID } from 'crypto'

/**
 * Add a project update
 * 
 * @route POST /api/projects/:id/updates
 */
export default defineEventHandler(async (event) => {
  try {
    // Get project ID from URL param
    const projectId = getRouterParam(event, 'id')
    
    if (!projectId) {
      return createError({
        statusCode: 400,
        statusMessage: 'Project ID is required'
      })
    }
    
    // Validate projectId format before creating ObjectId
    if (!ObjectId.isValid(projectId)) {
      return createError({
        statusCode: 400,
        statusMessage: 'Invalid project ID format'
      })
    }
    
    // Parse request body
    const body = await readBody(event)
    
    // Validate required fields
    if (!body.content && !body.message) {
      return createError({
        statusCode: 400,
        statusMessage: 'Update content is required'
      })
    }
    
    // Create update object - including required ID field for document validation
    const update = {
      id: body.id || randomUUID(), // Generate a UUID if not provided
      message: body.content || body.message,
      date: body.date || new Date().toISOString().split('T')[0],
      user: body.author || body.user || 'Anonymous',
      createdAt: new Date()
    }
    
    // Connect to database
    const { db } = await connectToDatabase()
    
    // Add update to the project
    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $push: { 
          "updates": {
            $each: [update],
            $position: 0
          }
        },
        $set: { lastUpdated: update.date }
      }
    )
    
    if (result.matchedCount === 0) {
      return createError({
        statusCode: 404,
        statusMessage: 'Project not found'
      })
    }
    
    if (result.modifiedCount === 0) {
      return createError({
        statusCode: 500,
        statusMessage: 'Failed to add update'
      })
    }
    
    // Return success with the created update
    return {
      success: true,
      update
    }
  } catch (error) {
    console.error('Error adding project update:', error)
    return createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to add update'
    })
  }
})