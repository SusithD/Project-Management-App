import { defineEventHandler, getRouterParam, createError } from 'h3';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { connectToDatabase } from '~/server/utils/database';
import { ObjectId } from 'mongodb';

/**
 * Delete a project file
 * 
 * @route DELETE /api/projects/:id/files/:name
 */
export default defineEventHandler(async (event) => {
  try {
    // Get project ID and file name from URL params
    const projectId = getRouterParam(event, 'id');
    const fileName = getRouterParam(event, 'name');
    
    if (!projectId || !fileName) {
      return createError({
        statusCode: 400,
        statusMessage: 'Project ID and file name are required'
      });
    }

    // Sanitize file name to prevent path traversal
    const sanitizedFileName = fileName.replace(/[/\\?%*:|"<>]/g, '-');
    
    // Get file path
    const filePath = join(process.cwd(), 'uploads', projectId, sanitizedFileName);
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Find the project and remove the file from its files array
    const result = await db.collection('projects').updateOne(
      { _id: new ObjectId(projectId) },
      { $pull: { 'files': { name: sanitizedFileName } } } as any
    );
    
    if (result.matchedCount === 0) {
      return createError({
        statusCode: 404,
        statusMessage: 'Project not found'
      });
    }
    
    // Delete the file from the filesystem
    try {
      await unlink(filePath);
    } catch (error) {
      console.warn(`File ${filePath} could not be deleted from disk:`, error);
      // Continue anyway, as we've already removed it from the database
    }
    
    return {
      message: 'File deleted successfully',
      fileName: sanitizedFileName
    };
  } catch (error) {
    console.error('Error deleting file:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'Failed to delete file'
    });
  }
});