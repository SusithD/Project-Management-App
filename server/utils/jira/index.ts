import { JiraClient } from './client';
import type { JiraConfig } from '~/types/jira';

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