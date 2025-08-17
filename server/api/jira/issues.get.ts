import { defineEventHandler, getQuery } from 'h3';
import { getJiraClient } from '~/server/utils/jira';
import { isDemoMode, isDemoUserEmail } from '~/server/utils/demo-mode';
import { DEMO_JIRA_ISSUES } from '~/server/utils/demo-data';

/**
 * Get JIRA issues for a specific project
 * 
 * @route GET /api/jira/issues?projectKey=ABC&maxResults=50
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const projectKey = query.projectKey as string;
    const maxResults = parseInt(query.maxResults as string) || 50;
    
    if (!projectKey) {
      return {
        statusCode: 400,
        body: {
          success: false,
          message: 'Project key is required'
        }
      };
    }
    
    // Check if demo mode is enabled
    const demoMode = isDemoMode();
    
    // Get user email from query parameter (sent by client)
    const queryParams = getQuery(event);
    const userEmail = queryParams.userEmail as string;
    
    // Check if current user is a demo user
    const isDemoUser = userEmail && isDemoUserEmail(userEmail);
    
    if (demoMode && isDemoUser) {
      console.log(`[JIRA API] Returning demo issues for project: ${projectKey}`);
      
      const demoIssues = DEMO_JIRA_ISSUES[projectKey] || [];
      const limitedIssues = demoIssues.slice(0, maxResults);
      
      return {
        statusCode: 200,
        body: {
          success: true,
          projectKey,
          issues: limitedIssues,
          demoMode: true
        }
      };
    }
    
    console.log(`[JIRA API] Fetching issues for project: ${projectKey}`);
    
    const jiraClient = getJiraClient();
    const issues = await jiraClient.getProjectIssues(projectKey, maxResults);
    
    console.log(`[JIRA API] Found ${issues.length} issues for project ${projectKey}`);
    
    return {
      statusCode: 200,
      body: {
        success: true,
        projectKey,
        issues: issues.map(issue => ({
          id: issue.id,
          key: issue.key,
          summary: issue.fields.summary,
          description: issue.fields.description,
          status: {
            name: issue.fields.status.name,
            category: issue.fields.status.statusCategory.name
          },
          priority: issue.fields.priority.name,
          assignee: issue.fields.assignee ? {
            accountId: issue.fields.assignee.accountId,
            displayName: issue.fields.assignee.displayName,
            emailAddress: issue.fields.assignee.emailAddress
          } : null,
          reporter: {
            accountId: issue.fields.reporter.accountId,
            displayName: issue.fields.reporter.displayName,
            emailAddress: issue.fields.reporter.emailAddress
          },
          created: issue.fields.created,
          updated: issue.fields.updated,
          duedate: issue.fields.duedate,
          issueType: issue.fields.issuetype.name
        })),
        demoMode: false
      }
    };
  } catch (error) {
    console.error('[JIRA API] Error fetching JIRA issues:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch JIRA issues'
      }
    };
  }
});