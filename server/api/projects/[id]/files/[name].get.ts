import { defineEventHandler, readMultipartFormData, getRouterParam, sendStream } from 'h3';
import { createReadStream, stat } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { connectToDatabase } from '~/server/utils/database';
import { ObjectId } from 'mongodb';

const statAsync = promisify(stat);

/**
 * Download a project file
 * 
 * @route GET /api/projects/:id/files/:name
 */
export default defineEventHandler(async (event) => {
  try {
    // Get project ID and file name from URL params
    const projectId = getRouterParam(event, 'id');
    const fileName = getRouterParam(event, 'name');
    
    if (!projectId || !fileName) {
      return {
        statusCode: 400,
        body: { error: 'Project ID and file name are required' }
      };
    }

    // Sanitize file name to prevent path traversal
    const sanitizedFileName = fileName.replace(/[/\\?%*:|"<>]/g, '-');
    
    // Get file path
    const filePath = join(process.cwd(), 'uploads', projectId, sanitizedFileName);
    
    // Verify file exists
    try {
      await statAsync(filePath);
    } catch (error) {
      return {
        statusCode: 404,
        body: { error: 'File not found' }
      };
    }
    
    // Connect to database to get file metadata
    const { db } = await connectToDatabase();
    const project = await db.collection('projects').findOne(
      { 
        _id: new ObjectId(projectId),
        'files.name': sanitizedFileName
      },
      { 
        projection: { 
          'files.$': 1 
        } 
      }
    );
    
    if (!project || !project.files || !project.files[0]) {
      return {
        statusCode: 404,
        body: { error: 'File metadata not found' }
      };
    }
    
    // Get file info
    const fileInfo = project.files[0];
    
    // Set appropriate headers
    event.node.res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName || sanitizedFileName}"`);
    event.node.res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
    event.node.res.setHeader('Content-Length', fileInfo.size);
    
    // Stream file to client
    return sendStream(event, createReadStream(filePath));
  } catch (error) {
    console.error('Error downloading file:', error);
    return {
      statusCode: 500,
      body: { error: 'Failed to download file' }
    };
  }
});