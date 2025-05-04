import { defineEventHandler, readBody } from 'h3'
import { connectToDatabase } from '~/server/utils/database';
import { ObjectId } from 'mongodb';

/**
 * Update a project
 * 
 * @route PUT /api/projects/:id
 */
export default defineEventHandler(async (event) => {
  try {
    // Get project ID from params
    const id = event.context.params?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: { error: 'Project ID is required' }
      };
    }

    // Get update data from request body
    const projectData = await readBody(event);
    if (!projectData) {
      return {
        statusCode: 400,
        body: { error: 'Project data is required' }
      };
    }
    
    // Prepare update data (remove fields that shouldn't be updated directly)
    const updateData = { ...projectData };
    
    // Don't overwrite these fields directly
    delete updateData._id;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.files; // Files are managed separately
    delete updateData.updates; // Updates are managed separately

    // Ensure lastUpdated is current
    updateData.lastUpdated = new Date().toISOString().split('T')[0];
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Update the project
    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        body: { error: 'Project not found' }
      };
    }
    
    // Get the updated project
    const updatedProject = await db.collection('projects').findOne(
      { _id: new ObjectId(id) }
    );
    
    // Ensure we found the project
    if (!updatedProject) {
      return {
        statusCode: 404,
        body: { error: 'Project not found after update' }
      };
    }
    
    // Format for response
    const formattedProject = {
      ...updatedProject,
      id: updatedProject._id.toString()
    };
    // Use type assertion to avoid TypeScript error
    delete (formattedProject as Record<string, any>)._id;
    
    return {
      statusCode: 200,
      body: formattedProject
    };
  } catch (error) {
    console.error('Error updating project:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to update project' }
    };
  }
});