import { defineEventHandler, createError } from 'h3';
import { getJiraClient } from '~/server/utils/jira';
import { isDemoMode, isDemoUserEmail } from '~/server/utils/demo-mode';
import { DEMO_JIRA_PROJECTS } from '~/server/utils/demo-data';

/**
 * Get all JIRA projects
 * 
 * @route GET /api/jira/projects
 */
export default defineEventHandler(async (event) => {
  try {
    // Check if demo mode is enabled
    const demoMode = isDemoMode();
    
    // Get user email from query parameter (sent by client)
    const query = getQuery(event);
    const userEmail = query.userEmail as string;
    
    // Check if current user is a demo user
    const isDemoUser = userEmail && isDemoUserEmail(userEmail);
    
    if (demoMode && isDemoUser) {
      console.log('[JIRA API] Returning demo JIRA projects...');
      
      return {
        success: true,
        projects: DEMO_JIRA_PROJECTS,
        demoMode: true
      };
    }
    
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
      })),
      demoMode: false
    };
  } catch (error) {
    console.error('[JIRA API] Error fetching JIRA projects:', error);
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to fetch JIRA projects'
    });
  }
});