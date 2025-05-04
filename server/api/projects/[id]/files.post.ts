// import { defineEventHandler, readMultipartFormData, getRouterParam, createError } from 'h3';
// import { writeFile, mkdir } from 'fs/promises';
// import { dirname, join } from 'path';
// import { connectToDatabase } from '~/server/utils/database';
// import { ObjectId } from 'mongodb';

// /**
//  * Upload a file for a project
//  * 
//  * @route POST /api/projects/:id/files
//  */
// export default defineEventHandler(async (event) => {
//   try {
//     // Get project ID from params
//     const id = getRouterParam(event, 'id');
//     if (!id) {
//       return createError({
//         statusCode: 400,
//         statusMessage: 'Project ID is required'
//       });
//     }

//     // Parse multipart form data to get file
//     const formData = await readMultipartFormData(event);
//     if (!formData || formData.length === 0) {
//       return createError({
//         statusCode: 400,
//         statusMessage: 'No file uploaded'
//       });
//     }

//     // Get file data
//     const fileData = formData.find(part => part.name === 'file');
//     if (!fileData) {
//       return createError({
//         statusCode: 400,
//         statusMessage: 'File is required'
//       });
//     }

//     // Get metadata from form
//     const uploadedBy = formData.find(part => part.name === 'uploadedBy')?.data.toString() || 'Unknown User';

//     // Ensure upload directory exists
//     const projectUploadDir = join(process.cwd(), 'uploads', id);
//     await mkdir(projectUploadDir, { recursive: true });

//     // Generate a safe filename (prevent path traversal)
//     const fileName = fileData.filename?.replace(/[/\\?%*:|"<>]/g, '-') || `file-${Date.now()}`;
//     const filePath = join(projectUploadDir, fileName);

//     // Write file to disk
//     await writeFile(filePath, fileData.data);

//     // File information to store in database
//     const fileInfo = {
//       name: fileName,
//       originalName: fileData.filename,
//       size: fileData.data.length,
//       mimeType: fileData.type,
//       path: filePath,
//       uploadedBy,
//       uploadedOn: new Date().toISOString().split('T')[0],
//       createdAt: new Date()
//     };

//     // Connect to database and update project
//     const { db } = await connectToDatabase();
    
//     // Correctly format the MongoDB update with $push operator
//     const result = await db.collection('projects').updateOne(
//       { _id: new ObjectId(id) },
//       { 
//         $push: { 
//           "files": fileInfo
//         },
//         $set: { lastUpdated: new Date().toISOString().split('T')[0] }
//       }
//     );
    
//     if (result.matchedCount === 0) {
//       return createError({
//         statusCode: 404,
//         statusMessage: 'Project not found'
//       });
//     }

//     // Return success with file information
//     return {
//       message: 'File uploaded successfully',
//       file: {
//         name: fileName,
//         size: formatFileSize(fileData.data.length),
//         mimeType: fileData.type,
//         uploadedBy,
//         uploadedOn: new Date().toISOString().split('T')[0]
//       }
//     };
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     return createError({
//       statusCode: 500,
//       statusMessage: 'Failed to upload file'
//     });
//   }
// });

// // Helper function to format file size
// function formatFileSize(bytes: number): string {
//   if (bytes === 0) return '0 Bytes';
  
//   const k = 1024;
//   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//   const i = Math.floor(Math.log(bytes) / Math.log(k));
  
//   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
// }