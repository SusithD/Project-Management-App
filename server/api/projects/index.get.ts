// GET endpoint to retrieve all projects with optional filtering
import { connectToDatabase } from '~/server/utils/database'
import { COLLECTIONS } from '~/server/utils/schemas'
import { Sort } from 'mongodb'
import { isDemoMode, isDemoUserEmail } from '~/server/utils/demo-mode'
import { DEMO_PROJECTS } from '~/server/utils/demo-data'

export default defineEventHandler(async (event) => {
  try {
    // Check if demo mode is enabled
    const demoMode = isDemoMode();
    
    // Get user email from query parameter (sent by client)
    const queryParams = getQuery(event);
    const userEmail = queryParams.userEmail as string;
    
    // Check if current user is a demo user
    const isDemoUser = userEmail && isDemoUserEmail(userEmail);
    
    if (demoMode && isDemoUser) {
      // Return demo projects with filtering
      const query = getQuery(event);
      let filteredProjects = [...DEMO_PROJECTS];
      
      // Apply text search filter
      if (query.search) {
        const searchTerm = query.search.toString().toLowerCase();
        filteredProjects = filteredProjects.filter(project => 
          project.name.toLowerCase().includes(searchTerm) ||
          project.remarks?.toLowerCase().includes(searchTerm) ||
          project.notes?.toLowerCase().includes(searchTerm) ||
          project.company?.toLowerCase().includes(searchTerm) ||
          project.comments?.toLowerCase().includes(searchTerm) ||
          project.blockers?.toLowerCase().includes(searchTerm) ||
          project.feedbackForBlockers?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply simple filters
      if (query.status) {
        filteredProjects = filteredProjects.filter(project => project.status === query.status);
      }
      if (query.assignee) {
        filteredProjects = filteredProjects.filter(project => project.assignedTo === query.assignee);
      }
      if (query.category) {
        filteredProjects = filteredProjects.filter(project => project.category === query.category);
      }
      if (query.priority) {
        filteredProjects = filteredProjects.filter(project => project.priority === query.priority);
      }
      if (query.company) {
        filteredProjects = filteredProjects.filter(project => project.company === query.company);
      }
      if (query.statusPhase) {
        filteredProjects = filteredProjects.filter(project => project.statusPhase === query.statusPhase);
      }
      if (query.responsiblePerson) {
        filteredProjects = filteredProjects.filter(project => project.responsiblePerson === query.responsiblePerson);
      }
      if (query.developer) {
        filteredProjects = filteredProjects.filter(project => 
          project.developers?.includes(query.developer!.toString())
        );
      }
      
      // Setup pagination
      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 100;
      const skip = (page - 1) * limit;
      
      const paginatedProjects = filteredProjects.slice(skip, skip + limit);
      
      return {
        projects: paginatedProjects,
        pagination: {
          total: filteredProjects.length,
          page,
          limit,
          pages: Math.ceil(filteredProjects.length / limit)
        },
        demoMode: true
      };
    }
    
    // Get query parameters for filtering
    const query = getQuery(event)
    const filter: Record<string, any> = {}
    
    // Apply text search filter
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { remarks: { $regex: query.search, $options: 'i' } },
        { notes: { $regex: query.search, $options: 'i' } },
        // Search in new fields
        { company: { $regex: query.search, $options: 'i' } },
        { comments: { $regex: query.search, $options: 'i' } },
        { blockers: { $regex: query.search, $options: 'i' } },
        { feedbackForBlockers: { $regex: query.search, $options: 'i' } }
      ]
    }
    
    // Apply simple filters
    if (query.status) filter.status = query.status
    if (query.assignee) filter.assignedTo = query.assignee
    if (query.category) filter.category = query.category
    if (query.priority) filter.priority = query.priority
    
    // Apply filters for new fields
    if (query.company) filter.company = query.company
    if (query.statusPhase) filter.statusPhase = query.statusPhase
    if (query.responsiblePerson) filter.responsiblePerson = query.responsiblePerson
    if (query.developer) filter.developers = query.developer
    
    // Apply date range filters
    if (query.startAfter || query.endBefore) {
      filter.$and = []
      if (query.startAfter) filter.$and.push({ startDate: { $gte: query.startAfter } })
      if (query.endBefore) filter.$and.push({ endDate: { $lte: query.endBefore } })
    }
    
    // Apply deadline filter
    if (query.deadlineBefore) {
      if (!filter.$and) filter.$and = []
      filter.$and.push({ deadline: { $lte: query.deadlineBefore } })
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
      },
      demoMode: false
    }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch projects'
    })
  }
})