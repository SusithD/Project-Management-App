import { JiraClient } from './client';
import type { 
  JiraConfig, 
  JiraIssue, 
  SyncConflict, 
  SyncResult, 
  BiDirectionalSyncConfig, 
  JiraReportMetrics 
} from '~/types/jira';
import { connectToDatabase } from '../database';
import { COLLECTIONS } from '../schemas';
import { ObjectId } from 'mongodb';

let jiraClientInstance: JiraClient | null = null;

/**
 * Get or create a JIRA client instance
 */
export function getJiraClient(): JiraClient {
  if (!jiraClientInstance) {
    const config = useRuntimeConfig();
    const jiraConfig: JiraConfig = config.jira as JiraConfig;
    
    if (!jiraConfig.enabled) {
      throw new Error('JIRA integration is disabled');
    }
    
    jiraClientInstance = new JiraClient(jiraConfig);
  }
  
  return jiraClientInstance;
}

/**
 * Test JIRA connection and configuration
 */
export async function testJiraConnection(): Promise<{
  success: boolean;
  message: string;
  config?: Partial<JiraConfig>;
}> {
  try {
    const config = useRuntimeConfig();
    const jiraConfig: JiraConfig = config.jira as JiraConfig;
    
    if (!jiraConfig.enabled) {
      return {
        success: false,
        message: 'JIRA integration is disabled'
      };
    }
    
    const client = getJiraClient();
    const isConnected = await client.testConnection();
    
    if (isConnected) {
      const user = await client.getCurrentUser();
      return {
        success: true,
        message: `Successfully connected to JIRA as ${user.displayName} (${user.emailAddress})`,
        config: {
          baseUrl: jiraConfig.baseUrl,
          email: jiraConfig.email,
          projectKey: jiraConfig.projectKey,
          enabled: jiraConfig.enabled
        }
      };
    } else {
      return {
        success: false,
        message: 'Failed to connect to JIRA'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Reset the JIRA client instance (useful for testing or config changes)
 */
export function resetJiraClient(): void {
  jiraClientInstance = null;
}

/**
 * Map project status to JIRA status
 */
export function mapProjectStatusToJira(projectStatus: string): string {
  const statusMap: Record<string, string> = {
    'Ongoing': 'In Progress',
    'Completed': 'Done',
    'On Hold': 'On Hold',
    'Planning': 'To Do',
    'Testing': 'In Review',
    'Deployed': 'Done'
  };
  
  return statusMap[projectStatus] || projectStatus;
}

/**
 * Map JIRA status to project status
 */
export function mapJiraStatusToProject(jiraStatus: string): string {
  const statusMap: Record<string, string> = {
    'To Do': 'Planning',
    'In Progress': 'Ongoing',
    'In Review': 'Testing',
    'Done': 'Completed',
    'Closed': 'Completed',
    'On Hold': 'On Hold',
    'Blocked': 'On Hold'
  };
  
  return statusMap[jiraStatus] || jiraStatus;
}

/**
 * Map project priority to JIRA priority
 */
export function mapProjectPriorityToJira(projectPriority: string): string {
  const priorityMap: Record<string, string> = {
    'Low': 'Low',
    'Medium': 'Medium',
    'High': 'High',
    'Urgent': 'Highest',
    'Critical': 'Highest'
  };
  
  return priorityMap[projectPriority] || 'Medium';
}

/**
 * Generate JIRA issue key from project info
 */
export function generateJiraIssueKey(projectKey: string, issueNumber?: number): string {
  if (issueNumber) {
    return `${projectKey}-${issueNumber}`;
  }
  return projectKey;
}

/**
 * Extract JIRA issue key from URL
 */
export function extractJiraIssueKey(url: string): string | null {
  const match = url.match(/([A-Z]+-\d+)/);
  return match ? match[1] : null;
}

/**
 * Validate JIRA URL format
 */
export function isValidJiraUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('atlassian.net') || 
           urlObj.pathname.includes('/browse/') ||
           urlObj.pathname.includes('/jira/');
  } catch {
    return false;
  }
}

/**
 * Bi-directional Sync Functions
 */
export async function detectSyncConflicts(
  projectData: any,
  jiraIssue: JiraIssue,
  syncConfig: BiDirectionalSyncConfig
): Promise<SyncConflict[]> {
  const conflicts: SyncConflict[] = [];
  
  // Check each enabled sync field for conflicts
  if (syncConfig.syncFields.summary && projectData.name !== jiraIssue.fields.summary) {
    conflicts.push({
      field: 'summary',
      jiraValue: jiraIssue.fields.summary,
      projectValue: projectData.name
    });
  }
  
  if (syncConfig.syncFields.description && projectData.description !== jiraIssue.fields.description) {
    conflicts.push({
      field: 'description',
      jiraValue: jiraIssue.fields.description,
      projectValue: projectData.description
    });
  }
  
  if (syncConfig.syncFields.status) {
    const projectStatus = mapProjectStatusToJira(projectData.status);
    if (projectStatus !== jiraIssue.fields.status.name) {
      conflicts.push({
        field: 'status',
        jiraValue: jiraIssue.fields.status.name,
        projectValue: projectData.status
      });
    }
  }
  
  if (syncConfig.syncFields.priority) {
    const projectPriority = mapProjectPriorityToJira(projectData.priority);
    if (projectPriority !== jiraIssue.fields.priority.name) {
      conflicts.push({
        field: 'priority',
        jiraValue: jiraIssue.fields.priority.name,
        projectValue: projectData.priority
      });
    }
  }
  
  return conflicts;
}

/**
 * Resolve sync conflicts based on configuration
 */
export function resolveSyncConflicts(
  conflicts: SyncConflict[],
  conflictResolution: BiDirectionalSyncConfig['conflictResolution'],
  projectLastUpdated: string,
  jiraLastUpdated: string
): SyncConflict[] {
  return conflicts.map(conflict => {
    let resolvedValue: any;
    let resolution: SyncConflict['resolution'];
    
    switch (conflictResolution) {
      case 'jira_wins':
        resolvedValue = conflict.jiraValue;
        resolution = 'jira';
        break;
      case 'project_wins':
        resolvedValue = conflict.projectValue;
        resolution = 'project';
        break;
      case 'newest_wins':
        const jiraDate = new Date(jiraLastUpdated);
        const projectDate = new Date(projectLastUpdated);
        if (jiraDate > projectDate) {
          resolvedValue = conflict.jiraValue;
          resolution = 'jira';
        } else {
          resolvedValue = conflict.projectValue;
          resolution = 'project';
        }
        break;
      case 'manual':
        // Leave for manual resolution
        resolution = 'manual';
        break;
    }
    
    return {
      ...conflict,
      resolvedValue,
      resolution
    };
  });
}

/**
 * Apply resolved conflicts to project and JIRA
 */
export async function applySyncResolution(
  projectId: string,
  jiraIssueKey: string,
  resolvedConflicts: SyncConflict[]
): Promise<SyncResult> {
  const client = getJiraClient();
  const { db } = await connectToDatabase();
  const projectsCollection = db.collection(COLLECTIONS.PROJECTS);
  
  const projectUpdates: any = {};
  const jiraUpdates: any = {};
  const updatedFields: string[] = [];
  
  for (const conflict of resolvedConflicts) {
    if (conflict.resolution === 'manual') continue;
    
    updatedFields.push(conflict.field);
    
    // Apply to project
    if (conflict.resolution === 'jira') {
      switch (conflict.field) {
        case 'summary':
          projectUpdates.name = conflict.resolvedValue;
          break;
        case 'description':
          projectUpdates.description = conflict.resolvedValue;
          break;
        case 'status':
          projectUpdates.status = mapJiraStatusToProject(conflict.resolvedValue);
          break;
        case 'priority':
          projectUpdates.priority = conflict.resolvedValue;
          break;
      }
    }
    
    // Apply to JIRA
    if (conflict.resolution === 'project') {
      switch (conflict.field) {
        case 'summary':
          jiraUpdates.summary = conflict.resolvedValue;
          break;
        case 'description':
          jiraUpdates.description = conflict.resolvedValue;
          break;
        case 'status':
          // Handle status transitions separately
          break;
        case 'priority':
          jiraUpdates.priority = { name: conflict.resolvedValue };
          break;
      }
    }
  }
  
  // Update project if needed
  if (Object.keys(projectUpdates).length > 0) {
    await projectsCollection.updateOne(
      { _id: new ObjectId(projectId) },
      { 
        $set: {
          ...projectUpdates,
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      }
    );
  }
  
  // Update JIRA if needed
  if (Object.keys(jiraUpdates).length > 0) {
    await client.updateIssue(jiraIssueKey, jiraUpdates);
  }
  
  return {
    success: true,
    conflictsDetected: resolvedConflicts,
    conflictsResolved: resolvedConflicts.filter(c => c.resolution !== 'manual'),
    updatedFields,
    message: `Sync completed. ${updatedFields.length} fields updated.`
  };
}

/**
 * Generate JIRA reports and metrics
 */
export async function generateJiraReportMetrics(projectKey: string): Promise<JiraReportMetrics> {
  const client = getJiraClient();
  
  // Fetch all issues for the project
  const jql = `project = "${projectKey}" ORDER BY created DESC`;
  const searchResult = await client.searchIssuesAdvanced(jql, [], ['changelog']);
  const issues = searchResult.issues;
  
  // Calculate metrics
  const totalIssues = issues.length;
  
  // Issues by status
  const issuesByStatus: Record<string, number> = {};
  issues.forEach(issue => {
    const status = issue.fields.status.name;
    issuesByStatus[status] = (issuesByStatus[status] || 0) + 1;
  });
  
  // Issues by priority
  const issuesByPriority: Record<string, number> = {};
  issues.forEach(issue => {
    const priority = issue.fields.priority.name;
    issuesByPriority[priority] = (issuesByPriority[priority] || 0) + 1;
  });
  
  // Issues by type
  const issuesByType: Record<string, number> = {};
  issues.forEach(issue => {
    const type = issue.fields.issuetype.name;
    issuesByType[type] = (issuesByType[type] || 0) + 1;
  });
  
  // Calculate average resolution time (for completed issues)
  const completedIssues = issues.filter(issue => 
    issue.fields.status.statusCategory.key === 'done'
  );
  
  let totalResolutionTime = 0;
  completedIssues.forEach(issue => {
    const created = new Date(issue.fields.created);
    const updated = new Date(issue.fields.updated);
    totalResolutionTime += updated.getTime() - created.getTime();
  });
  
  const averageResolutionTime = completedIssues.length > 0 
    ? totalResolutionTime / completedIssues.length / (1000 * 60 * 60 * 24) // Convert to days
    : 0;
  
  // Calculate velocity (issues completed in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentCompletedIssues = completedIssues.filter(issue => 
    new Date(issue.fields.updated) > thirtyDaysAgo
  );
  
  const velocity = {
    current: recentCompletedIssues.length,
    trend: 0 // Could be calculated by comparing with previous periods
  };
  
  // Generate burndown data (last 30 days)
  const burndown: Array<{date: string, remaining: number, completed: number}> = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const completedByDate = issues.filter(issue => {
      const updated = new Date(issue.fields.updated);
      return updated <= date && issue.fields.status.statusCategory.key === 'done';
    }).length;
    
    const remaining = totalIssues - completedByDate;
    
    burndown.push({
      date: dateStr,
      remaining,
      completed: completedByDate
    });
  }
  
  return {
    totalIssues,
    issuesByStatus,
    issuesByPriority,
    issuesByType,
    averageResolutionTime,
    velocity,
    burndown
  };
}