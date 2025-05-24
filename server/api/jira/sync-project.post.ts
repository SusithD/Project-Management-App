import { defineEventHandler, readBody } from 'h3';
import { getJiraClient } from '~/server/utils/jira';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS } from '~/server/utils/schemas';
import { ObjectId } from 'mongodb';

/**
 * Sync project data with JIRA
 * 
 * @route POST /api/jira/sync-project
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
    
    console.log(`[JIRA API] Syncing project ${projectId} with JIRA`);
    
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
    
    // Check if project has JIRA integration
    if (!project.jiraIntegration?.enabled || !project.jiraIntegration?.projectKey) {
      return {
        statusCode: 400,
        body: {
          success: false,
          message: 'Project is not linked to JIRA'
        }
      };
    }
    
    const jiraProjectKey = project.jiraIntegration.projectKey;
    
    // Get JIRA client and fetch issues
    const jiraClient = getJiraClient();
    
    try {
      // Fetch JIRA project details and issues
      const [jiraProject, issues] = await Promise.all([
        jiraClient.getProject(jiraProjectKey),
        jiraClient.searchIssues(`project = ${jiraProjectKey}`, 0, 1000)
      ]);
      
      // Calculate sync statistics
      const totalIssues = issues.total || issues.issues?.length || 0;
      const completedIssues = issues.issues?.filter((issue: any) => 
        issue.fields?.status?.statusCategory?.key === 'done'
      ).length || 0;
      const pendingIssues = totalIssues - completedIssues;
      const progressPercentage = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
      
      // Prepare sync data with proper typing
      const syncData: any = {
        'jiraIntegration.lastSyncDate': new Date().toISOString(),
        'jiraIntegration.syncStats': {
          totalIssues,
          completedIssues,
          pendingIssues,
          progressPercentage,
          lastSyncAt: new Date().toISOString()
        },
        'jiraIntegration.projectName': jiraProject.name,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      
      // Update project status based on JIRA data
      if (progressPercentage === 100) {
        syncData.status = 'Completed';
      } else if (progressPercentage > 0) {
        syncData.status = 'In Progress';
      } else {
        syncData.status = 'Planning';
      }
      
      // Update progress
      syncData.progress = progressPercentage;
      
      // Update the project in database
      const result = await projectsCollection.updateOne(
        { _id: project._id },
        { $set: syncData }
      );
      
      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          body: {
            success: false,
            message: 'Failed to update project'
          }
        };
      }
      
      console.log(`[JIRA API] Successfully synced project ${project.name} with JIRA`);
      
      return {
        statusCode: 200,
        body: {
          success: true,
          message: `Project "${project.name}" successfully synced with JIRA`,
          syncStats: {
            totalIssues,
            completedIssues,
            pendingIssues,
            progressPercentage,
            lastSyncAt: syncData['jiraIntegration.lastSyncDate']
          }
        }
      };
      
    } catch (jiraError: unknown) {
      // Handle JIRA API errors
      const errorMessage = jiraError instanceof Error ? jiraError.message : 'Failed to fetch JIRA data';
      
      // Log sync error to project
      await projectsCollection.updateOne(
        { _id: project._id },
        { 
          $set: {
            'jiraIntegration.lastSyncDate': new Date().toISOString(),
            'jiraIntegration.lastSyncError': errorMessage
          }
        }
      );
      
      console.error(`[JIRA API] JIRA sync error for project ${project.name}:`, jiraError);
      
      return {
        statusCode: 500,
        body: {
          success: false,
          message: `Failed to sync with JIRA: ${errorMessage}`
        }
      };
    }
    
  } catch (error) {
    console.error('[JIRA API] Error syncing project with JIRA:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to sync project with JIRA'
      }
    };
  }
});