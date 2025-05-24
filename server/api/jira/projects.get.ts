import { defineEventHandler } from 'h3';
import { getJiraClient } from '~/server/utils/jira';

/**
 * Get all JIRA projects
 * 
 * @route GET /api/jira/projects
 */
export default defineEventHandler(async (event) => {
  try {
    console.log('[JIRA API] Fetching JIRA projects...');
    
    const jiraClient = getJiraClient();
    const projects = await jiraClient.getProjects();
    
    console.log(`[JIRA API] Found ${projects.length} JIRA projects`);
    
    return {
      statusCode: 200,
      body: {
        success: true,
        projects: projects.map(project => ({
          id: project.id,
          key: project.key,
          name: project.name,
          projectTypeKey: project.projectTypeKey,
          style: project.style,
          isPrivate: project.isPrivate
        }))
      }
    };
  } catch (error) {
    console.error('[JIRA API] Error fetching JIRA projects:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch JIRA projects'
      }
    };
  }
});