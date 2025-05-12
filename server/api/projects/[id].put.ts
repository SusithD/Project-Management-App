import { ObjectId, Int32 } from 'mongodb'
// Import auth from Nuxt
import { useRuntimeConfig } from '#imports'
import { connectToDatabase } from '~/server/utils/database'
import { COLLECTIONS } from '~/server/utils/schemas'
import { sendProjectAssignmentNotification } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication using headers instead of getServerSession
    const authHeader = getRequestHeader(event, 'Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      });
    }

    // Get project ID from route params
    const id = getRouterParam(event, 'id');
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Project ID is required'
      });
    }

    // Parse request body
    const body = await readBody(event);
    
    // Connect to database
    const { db } = await connectToDatabase()
    const collection = db.collection(COLLECTIONS.PROJECTS)
    
    // Get original project to check for changes in assignment
    let query;
    try {
      // Try to convert to ObjectId
      query = { _id: new ObjectId(id) };
    } catch (err) {
      // If not a valid ObjectId, search by numeric id
      query = { id: parseInt(id) };
    }
    
    // Get the original project before making changes
    const originalProject = await collection.findOne(query);
    
    if (!originalProject) {
      throw createError({
        statusCode: 404,
        message: 'Project not found'
      });
    }
    
    // Prepare update data - exclude _id field
    const { _id, ...updateData } = body;
    
    // Current date for lastUpdated
    const currentDate = new Date().toISOString().split('T')[0]
    updateData.lastUpdated = currentDate;
    
    // Ensure all integer fields are properly converted to MongoDB Int32
    if (updateData.progress !== undefined) {
      updateData.progress = new Int32(parseInt(updateData.progress) || 0);
    }
    
    if (updateData.pendingDays !== undefined) {
      updateData.pendingDays = new Int32(parseInt(updateData.pendingDays) || 0);
    }
    
    if (updateData.id !== undefined && typeof updateData.id === 'number') {
      updateData.id = new Int32(updateData.id);
    }
    
    // Ensure status is one of the allowed values in schema
    if (updateData.status) {
      // MongoDB schema only allows these values
      const allowedStatuses = ['Ongoing', 'Completed', 'On Hold'];
      
      // If status isn't in allowed list, default to 'Ongoing'
      if (!allowedStatuses.includes(updateData.status)) {
        console.warn(`Status '${updateData.status}' not allowed by schema. Defaulting to 'Ongoing'.`);
        updateData.status = 'Ongoing';
      }
    }
    
    // Ensure arrays are properly initialized if they don't exist
    if (updateData.team === undefined) {
      updateData.team = [];
    }
    
    // Update project in database
    const result = await collection.updateOne(
      query,
      { $set: updateData }
    );
    
    // Check if document was found and updated
    if (result.matchedCount === 0) {
      throw createError({
        statusCode: 404,
        message: 'Project not found'
      });
    }
    
    // Fetch the updated project
    const updatedProject = await collection.findOne(query);
    
    // Check if the assignment has changed and send email notification
    if (updatedProject && 
        updateData.assignedTo && 
        (!originalProject.assignedTo || 
         originalProject.assignedTo.toString() !== updateData.assignedTo.toString())) {
      try {
        // Get user info from database
        const usersCollection = db.collection(COLLECTIONS.USERS);
        const assignedUser = await usersCollection.findOne({ _id: updateData.assignedTo });
        
        if (assignedUser && assignedUser.email) {
          // Get info about who made the update
          let updaterName = 'System Administrator';
          if (body.userEmail) {
            const updater = await usersCollection.findOne({ email: body.userEmail });
            if (updater && updater.name) {
              updaterName = updater.name;
            }
          }
          
          // Send notification to the newly assigned user
          await sendProjectAssignmentNotification(
            assignedUser.email,
            assignedUser.name || 'Team Member',
            updatedProject.name,
            updatedProject._id.toString(),
            updaterName
          );
          
          console.log(`Project assignment notification sent to ${assignedUser.email}`);
        }
      } catch (emailError) {
        // Log the error but don't fail the project update
        console.error('Error sending project assignment email:', emailError);
      }
    }
    
    return updatedProject;
  } catch (error) {
    console.error('Error updating project:', error);
    return createError({
      statusCode: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to update project'
    });
  }
});
