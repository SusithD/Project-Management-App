// POST endpoint to create a new project
import { Int32 } from 'mongodb'
import { connectToDatabase } from '~/server/utils/database'
import { COLLECTIONS, Project } from '~/server/utils/schemas'

export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody(event)
    
    // Connect to database
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTIONS.PROJECTS)
    
    // Get the next project ID
    const lastProject = await collection.find().sort({ id: -1 }).limit(1).toArray()
    const nextId = lastProject.length > 0 ? lastProject[0].id + 1 : 1
    
    // Current date for timestamps
    const currentDate = new Date().toISOString().split('T')[0]
    
    // Create new project document
    const newProject: Project = {
      id: new Int32(nextId),
      name: body.name,
      status: body.status || 'Ongoing',
      progress: new Int32(parseInt(body.progress) || 0),
      assignedTo: body.assignedTo,
      startDate: body.startDate,
      endDate: body.endDate,
      lastUpdated: currentDate,
      createdAt: currentDate,
      remarks: body.remarks || '',
      notes: body.notes || '',
      priority: body.priority,
      category: body.category,
      team: Array.isArray(body.team) ? body.team : []
    }
    
    // Insert the new project
    const result = await collection.insertOne(newProject)
    
    if (!result.acknowledged) {
      throw new Error('Failed to insert project')
    }
    
    // Return the created project with its new ID
    return {
      ...newProject,
      _id: result.insertedId
    }
  } catch (error) {
    console.error('Error creating project:', error)
    return createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to create project'
    })
  }
})