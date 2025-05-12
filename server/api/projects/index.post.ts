import { Int32, ObjectId } from 'mongodb'
import { connectToDatabase } from '~/server/utils/database'
import { COLLECTIONS, Project } from '~/server/utils/schemas'
import { sendProjectAssignmentNotification } from '~/server/utils/email'
// Import auth from Nuxt
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  try {
    console.log('[Projects API] Creating new project...');
    
    // Check authentication using headers instead of getServerSession
    const authHeader = getRequestHeader(event, 'Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      });
    }

    // Parse request body
    const body = await readBody(event)
    console.log(`📋 [Projects API] Project data received: ${body.name}, assignedTo: ${body.assignedTo || 'none'}`);
    
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
      team: Array.isArray(body.team) ? body.team : [],
      
      // New fields
      company: body.company || '',
      statusPhase: body.statusPhase || '',
      deadline: body.deadline || '',
      comments: body.comments || '',
      developers: Array.isArray(body.developers) ? body.developers : [],
      blockers: body.blockers || '',
      responsiblePerson: body.responsiblePerson || '',
      initiallyRaisedOn: body.initiallyRaisedOn || currentDate,
      pendingDays: new Int32(parseInt(body.pendingDays) || 0),
      feedbackForBlockers: body.feedbackForBlockers || '',
      createdBy: body.userEmail || 'unknown',
      externalLinks: {
        githubRepo: body.externalLinks?.githubRepo || '',
        figmaLink: body.externalLinks?.figmaLink || '',
        jiraProject: body.externalLinks?.jiraProject || ''
      }
    }
    
    // Insert the new project
    const result = await collection.insertOne(newProject)
    
    if (!result.acknowledged) {
      throw new Error('Failed to insert project')
    }
    
    console.log(`[Projects API] Project "${newProject.name}" created with ID: ${result.insertedId}`);
    
    // Send email notification if a user is assigned
    if (newProject.assignedTo) {
      console.log(`[Projects API] Project has assignee ID: ${newProject.assignedTo}, preparing email notification...`);
      
      try {
        // Find the assigned user to get their email - using the id field, not _id
        const usersCollection = db.collection(COLLECTIONS.USERS)
        // Look up the user by their string ID (e.g., "sa001") instead of trying to use ObjectId
        const assignedUser = await usersCollection.findOne({ id: newProject.assignedTo })
        
        console.log(`[Projects API] Found assigned user:`, assignedUser ? 
          `${assignedUser.name} (${assignedUser.email})` : 
          'User not found');
        
        if (assignedUser && assignedUser.email) {
          // Find the creator for the "assigned by" field
          let creatorName = 'System Administrator'
          if (body.userEmail) {
            console.log(`📧 [Projects API] Looking up creator by email: ${body.userEmail}`);
            const creator = await usersCollection.findOne({ email: body.userEmail })
            if (creator && creator.name) {
              creatorName = creator.name
              console.log(`📧 [Projects API] Found creator: ${creatorName}`);
            } else {
              console.log(`📧 [Projects API] Creator not found, using default: ${creatorName}`);
            }
          }
          
          // Send notification
          console.log(`[Projects API] Calling sendProjectAssignmentNotification for ${assignedUser.email}`);
          const emailResult = await sendProjectAssignmentNotification(
            assignedUser.email,
            assignedUser.name || 'Team Member',
            newProject.name,
            result.insertedId.toString(),
            creatorName
          )
          
          console.log(`[Projects API] Email notification result:`, emailResult);
        } else {
          console.warn(`⚠️ [Projects API] Cannot send email: Assigned user not found or has no email address`);
        }
      } catch (emailError) {
        // Log the error but don't fail the project creation
        console.error('❌ [Projects API] Error sending project assignment email:', emailError)
      }
    } else {
      console.log(`📋 [Projects API] No assignee for project, skipping email notification`);
    }
    
    // Return the created project with its new ID
    return {
      ...newProject,
      _id: result.insertedId
    }
  } catch (error) {
    console.error('[Projects API] Error creating project:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to create project'
    })
  }
})