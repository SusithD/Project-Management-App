import { defineEventHandler, readBody } from 'h3';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS } from '~/server/utils/schemas';
import { ObjectId } from 'mongodb';

/**
 * Unlink a project from JIRA
 * 
 * @route POST /api/jira/unlink-project
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { projectId } = body;
    
    if (!projectId) {
      return {
        statusCode: 400,
        body: {
          success: false,
          message: 'Project ID is required'
        }
      };
    }
    
    console.log(`[JIRA API] Unlinking project ${projectId} from JIRA`);
    
    // Connect to database
    const { db } = await connectToDatabase();
    const projectsCollection = db.collection(COLLECTIONS.PROJECTS);
    
    // Build query filter with proper type handling
    const queryFilter: any = {
      $or: [
        { id: parseInt(projectId) }
      ]
    };
    
    // Only add ObjectId filter if projectId is a valid ObjectId string
    if (typeof projectId === 'string' && ObjectId.isValid(projectId)) {
      queryFilter.$or.push({ _id: new ObjectId(projectId) });
    }
    
    // Find the project
    const project = await projectsCollection.findOne(queryFilter);
    
    if (!project) {
      return {
        statusCode: 404,
        body: {
          success: false,
          message: 'Project not found'
        }
      };
    }
    
    // Remove JIRA integration data
    const result = await projectsCollection.updateOne(
      { _id: project._id },
      { 
        $unset: { 
          jiraIntegration: "",
          'externalLinks.jiraProject': ""
        },
        $set: {
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        body: {
          success: false,
          message: 'Failed to unlink project from JIRA'
        }
      };
    }
    
    console.log(`[JIRA API] Successfully unlinked project ${project.name} from JIRA`);
    
    return {
      statusCode: 200,
      body: {
        success: true,
        message: `Project "${project.name}" successfully unlinked from JIRA`
      }
    };
  } catch (error) {
    console.error('[JIRA API] Error unlinking project from JIRA:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unlink project from JIRA'
      }
    };
  }
});