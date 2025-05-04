// GET endpoint to retrieve all projects with optional filtering
import { connectToDatabase } from '~/server/utils/database'
import { COLLECTIONS } from '~/server/utils/schemas'
import { Sort } from 'mongodb'

export default defineEventHandler(async (event) => {
  try {
    // Get query parameters for filtering
    const query = getQuery(event)
    const filter: Record<string, any> = {}
    
    // Apply text search filter
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { remarks: { $regex: query.search, $options: 'i' } },
        { notes: { $regex: query.search, $options: 'i' } }
      ]
    }
    
    // Apply simple filters
    if (query.status) filter.status = query.status
    if (query.assignee) filter.assignedTo = query.assignee
    if (query.category) filter.category = query.category
    if (query.priority) filter.priority = query.priority
    
    // Apply date range filters
    if (query.startAfter || query.endBefore) {
      filter.$and = []
      if (query.startAfter) filter.$and.push({ startDate: { $gte: query.startAfter } })
      if (query.endBefore) filter.$and.push({ endDate: { $lte: query.endBefore } })
    }
    
    // Get database connection
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTIONS.PROJECTS)
    
    // Setup sorting
    const sortField = String(query.sortBy || 'createdAt')
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1
    const sortOptions: Sort = { [sortField]: sortOrder }
    
    // Setup pagination
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 100
    const skip = (page - 1) * limit
    
    // Execute query
    const [projects, total] = await Promise.all([
      collection.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter)
    ])
    
    // Return results with pagination metadata
    return {
      projects,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch projects'
    })
  }
})