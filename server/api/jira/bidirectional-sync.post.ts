import { defineEventHandler, readBody } from 'h3';
import { 
  getJiraClient, 
  detectSyncConflicts, 
  resolveSyncConflicts, 
  applySyncResolution 
} from '~/server/utils/jira';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS } from '~/server/utils/schemas';
import { ObjectId } from 'mongodb';
import type { BiDirectionalSyncConfig } from '~/types/jira';

/**
 * Perform bi-directional sync between project and JIRA
 * 
 * @route POST /api/jira/bidirectional-sync
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { projectId, jiraIssueKey, syncConfig, resolveConflicts = true } = body;
    
    if (!projectId || !jiraIssueKey) {
      return {
        statusCode: 400,
        body: {
          success: false,
          message: 'Project ID and JIRA issue key are required'
        }
      };
    }
    
    console.log(`[JIRA API] Starting bi-directional sync for project ${projectId} and issue ${jiraIssueKey}`);
    
    // Get project data
    const { db } = await connectToDatabase();
    const projectsCollection = db.collection(COLLECTIONS.PROJECTS);
    
    const queryFilter: any = {
      $or: [{ id: parseInt(projectId) }]
    };
    
    if (typeof projectId === 'string' && ObjectId.isValid(projectId)) {
      queryFilter.$or.push({ _id: new ObjectId(projectId) });
    }
    
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
    
    // Get JIRA issue data
    const jiraClient = getJiraClient();
    const jiraIssue = await jiraClient.getIssue(jiraIssueKey);
    
    // Use default sync config if not provided
    const defaultSyncConfig: BiDirectionalSyncConfig = {
      enabled: true,
      conflictResolution: 'newest_wins',
      syncFields: {
        summary: true,
        description: true,
        status: true,
        priority: true,
        assignee: false,
        dueDate: true,
        progress: true
      },
      ...syncConfig
    };
    
    // Detect conflicts
    const conflicts = await detectSyncConflicts(project, jiraIssue, defaultSyncConfig);
    
    if (conflicts.length === 0) {
      return {
        statusCode: 200,
        body: {
          success: true,
          message: 'No conflicts detected. Data is already in sync.',
          conflicts: [],
          syncResult: null
        }
      };
    }
    
    console.log(`[JIRA API] Detected ${conflicts.length} sync conflicts`);
    
    if (!resolveConflicts) {
      // Return conflicts for manual resolution
      return {
        statusCode: 200,
        body: {
          success: true,
          message: `${conflicts.length} conflicts detected. Manual resolution required.`,
          conflicts,
          syncResult: null
        }
      };
    }
    
    // Resolve conflicts automatically
    const projectLastUpdated = project.lastUpdated || project.createdAt || new Date().toISOString();
    const jiraLastUpdated = jiraIssue.fields.updated;
    
    const resolvedConflicts = resolveSyncConflicts(
      conflicts,
      defaultSyncConfig.conflictResolution,
      projectLastUpdated,
      jiraLastUpdated
    );
    
    // Apply resolutions
    const syncResult = await applySyncResolution(
      projectId,
      jiraIssueKey,
      resolvedConflicts
    );
    
    // Update sync timestamp
    await projectsCollection.updateOne(
      { _id: project._id },
      { 
        $set: {
          'jiraIntegration.lastSyncDate': new Date().toISOString(),
          'jiraIntegration.lastBidirectionalSync': new Date().toISOString()
        }
      }
    );
    
    console.log(`[JIRA API] Bi-directional sync completed for project ${project.name}`);
    
    return {
      statusCode: 200,
      body: {
        success: true,
        message: syncResult.message,
        conflicts: resolvedConflicts,
        syncResult
      }
    };
    
  } catch (error) {
    console.error('[JIRA API] Error in bi-directional sync:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to perform bi-directional sync'
      }
    };
  }
});