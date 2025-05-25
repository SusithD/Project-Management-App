import { defineEventHandler, getQuery } from 'h3';
import { ObjectId } from 'mongodb';
import { generateJiraReportMetrics } from '~/server/utils/jira';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS } from '~/server/utils/schemas';
import type { ProjectJiraMetrics } from '~/types/jira';

/**
 * Generate comprehensive JIRA reports and metrics
 * 
 * @route GET /api/jira/reports?projectKey=ABC&projectId=123&includeMetrics=true
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const projectKey = query.projectKey as string;
    const projectId = query.projectId as string;
    const includeMetrics = query.includeMetrics === 'true';
    
    console.log(`[JIRA Reports API] Received request:`, { projectKey, projectId, includeMetrics });
    
    if (!projectKey && !projectId) {
      console.error('[JIRA Reports API] Missing required parameters');
      return {
        statusCode: 400,
        body: {
          success: false,
          message: 'Either project key or project ID is required'
        }
      };
    }
    
    console.log(`[JIRA Reports API] Generating reports for ${projectKey || projectId}`);
    
    let finalProjectKey = projectKey;
    let projectName = '';
    
    // If projectId is provided, get the JIRA project key from database
    if (projectId && !projectKey) {
      console.log(`[JIRA Reports API] Looking up project in database: ${projectId}`);
      const { db } = await connectToDatabase();
      const projectsCollection = db.collection(COLLECTIONS.PROJECTS);
      
      // Build query that handles both string IDs and ObjectIds
      const projectQuery: any = {};
      if (ObjectId.isValid(projectId)) {
        projectQuery.$or = [
          { _id: new ObjectId(projectId) },
          { id: parseInt(projectId) || projectId }
        ];
      } else {
        projectQuery.$or = [
          { id: parseInt(projectId) || projectId },
          { _id: projectId }
        ];
      }
      
      console.log(`[JIRA Reports API] Database query:`, JSON.stringify(projectQuery, null, 2));
      const project = await projectsCollection.findOne(projectQuery);
      console.log(`[JIRA Reports API] Found project:`, project ? `${project.name} (${project.jiraIntegration?.projectKey})` : 'null');
      
      if (!project?.jiraIntegration?.projectKey) {
        console.error('[JIRA Reports API] Project not found or not linked to JIRA');
        return {
          statusCode: 404,
          body: {
            success: false,
            message: 'Project not found or not linked to JIRA'
          }
        };
      }
      
      finalProjectKey = project.jiraIntegration.projectKey;
      projectName = project.name;
      console.log(`[JIRA Reports API] Using project key: ${finalProjectKey}`);
    }
    
    // Validate project key format
    if (!finalProjectKey || typeof finalProjectKey !== 'string' || finalProjectKey.trim() === '') {
      console.error('[JIRA Reports API] Invalid project key:', finalProjectKey);
      return {
        statusCode: 400,
        body: {
          success: false,
          message: 'Invalid project key format'
        }
      };
    }
    
    console.log(`[JIRA Reports API] About to generate metrics for project key: "${finalProjectKey}"`);
    
    // Generate metrics
    const metrics = await generateJiraReportMetrics(finalProjectKey);
    
    // Prepare report data
    const reportData: ProjectJiraMetrics = {
      projectId: projectId || '',
      projectName: projectName || `JIRA Project ${finalProjectKey}`,
      jiraProjectKey: finalProjectKey,
      metrics,
      lastUpdated: new Date().toISOString()
    };
    
    // Store metrics in database for caching
    if (projectId) {
      const { db } = await connectToDatabase();
      const projectsCollection = db.collection(COLLECTIONS.PROJECTS);
      
      // Build update query that handles both string IDs and ObjectIds
      const updateQuery: any = {};
      if (ObjectId.isValid(projectId)) {
        updateQuery.$or = [
          { _id: new ObjectId(projectId) },
          { id: parseInt(projectId) || projectId }
        ];
      } else {
        updateQuery.$or = [
          { id: parseInt(projectId) || projectId },
          { _id: projectId }
        ];
      }
      
      await projectsCollection.updateOne(
        updateQuery,
        { 
          $set: {
            'jiraIntegration.cachedMetrics': metrics,
            'jiraIntegration.metricsLastUpdated': new Date().toISOString()
          }
        }
      );
    }
    
    console.log(`[JIRA API] Generated report with ${metrics.totalIssues} issues`);
    
    return {
      statusCode: 200,
      body: {
        success: true,
        data: reportData,
        summary: {
          totalIssues: metrics.totalIssues,
          completedIssues: Object.entries(metrics.issuesByStatus)
            .filter(([status]) => ['Done', 'Closed'].includes(status))
            .reduce((sum, [, count]) => sum + count, 0),
          averageResolutionDays: Math.round(metrics.averageResolutionTime * 10) / 10,
          currentVelocity: metrics.velocity.current
        }
      }
    };
    
  } catch (error: unknown) {
    console.error('[JIRA Reports API] Detailed error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate JIRA reports',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      }
    };
  }
});