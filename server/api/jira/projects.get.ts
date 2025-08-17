import { defineEventHandler, createError } from 'h3';
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
    
    // Return data directly without wrapping in body
    return {
      success: true,
      projects: projects.map(project => ({
        id: project.id,
        key: project.key,
        name: project.name,
        projectTypeKey: project.projectTypeKey,
        style: project.style,
        isPrivate: project.isPrivate
      }))
    };
  } catch (error) {
    console.error('[JIRA API] Error fetching JIRA projects:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch JIRA projects'
    });
  }
});