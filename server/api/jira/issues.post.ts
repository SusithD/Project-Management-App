import { defineEventHandler, readBody } from 'h3';
import { getJiraClient, mapProjectPriorityToJira } from '~/server/utils/jira';

/**
 * Create a new JIRA issue
 * 
 * @route POST /api/jira/issues
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { projectKey, summary, description, issueType, priority, assigneeAccountId, dueDate } = body;
    
    if (!projectKey || !summary || !issueType) {
      return {
        statusCode: 400,
        body: {
          success: false,
          message: 'Project key, summary, and issue type are required'
        }
      };
    }
    
    console.log(`[JIRA API] Creating issue in project: ${projectKey}`);
    
    const jiraClient = getJiraClient();
    
    // Prepare issue data
    const issueData = {
      fields: {
        project: {
          key: projectKey
        },
        summary,
        description,
        issuetype: {
          name: issueType
        },
        ...(priority && {
          priority: {
            name: mapProjectPriorityToJira(priority)
          }
        }),
        ...(assigneeAccountId && {
          assignee: {
            accountId: assigneeAccountId
          }
        }),
        ...(dueDate && {
          duedate: dueDate
        })
      }
    };
    
    const createdIssue = await jiraClient.createIssue(issueData);
    
    console.log(`[JIRA API] Successfully created issue: ${createdIssue.key}`);
    
    return {
      statusCode: 201,
      body: {
        success: true,
        issue: {
          id: createdIssue.id,
          key: createdIssue.key,
          summary: createdIssue.fields.summary,
          description: createdIssue.fields.description,
          status: {
            name: createdIssue.fields.status.name,
            category: createdIssue.fields.status.statusCategory.name
          },
          priority: createdIssue.fields.priority.name,
          assignee: createdIssue.fields.assignee ? {
            accountId: createdIssue.fields.assignee.accountId,
            displayName: createdIssue.fields.assignee.displayName,
            emailAddress: createdIssue.fields.assignee.emailAddress
          } : null,
          created: createdIssue.fields.created,
          issueType: createdIssue.fields.issuetype.name,
          url: `${useRuntimeConfig().jira.baseUrl}/browse/${createdIssue.key}`
        }
      }
    };
  } catch (error) {
    console.error('[JIRA API] Error creating JIRA issue:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create JIRA issue'
      }
    };
  }
});