import { defineEventHandler, getQuery } from 'h3';
import { testJiraConnection, getJiraClient } from '~/server/utils/jira';

/**
 * Test JIRA connection and basic functionality
 * 
 * @route GET /api/jira/test-detailed?projectKey=ABC
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const projectKey = query.projectKey as string;
    
    console.log(`[JIRA Test] Starting detailed test with project key: ${projectKey}`);
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };
    
    // Test 1: Basic connection
    console.log(`[JIRA Test] Testing basic connection...`);
    try {
      const connectionTest = await testJiraConnection();
      results.tests.push({
        name: 'Basic Connection',
        success: connectionTest.success,
        message: connectionTest.message,
        config: connectionTest.config
      });
    } catch (error: unknown) {
      results.tests.push({
        name: 'Basic Connection',
        success: false,
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.stack : String(error)
      });
    }
    
    // Test 2: Get current user
    console.log(`[JIRA Test] Testing current user retrieval...`);
    try {
      const client = getJiraClient();
      const user = await client.getCurrentUser();
      results.tests.push({
        name: 'Current User',
        success: true,
        message: `User: ${user.displayName} (${user.emailAddress})`,
        data: { accountId: user.accountId, displayName: user.displayName }
      });
    } catch (error: unknown) {
      results.tests.push({
        name: 'Current User',
        success: false,
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.stack : String(error)
      });
    }
    
    // Test 3: List projects
    console.log(`[JIRA Test] Testing project listing...`);
    try {
      const client = getJiraClient();
      const projects = await client.getProjects();
      results.tests.push({
        name: 'List Projects',
        success: true,
        message: `Found ${projects.length} projects`,
        data: projects.map(p => ({ key: p.key, name: p.name, id: p.id }))
      });
    } catch (error: unknown) {
      results.tests.push({
        name: 'List Projects',
        success: false,
        message: error instanceof Error ? error.message : String(error),
        error: error instanceof Error ? error.stack : String(error)
      });
    }
    
    // Test 4: Specific project access (if projectKey provided)
    if (projectKey) {
      console.log(`[JIRA Test] Testing specific project access for: ${projectKey}`);
      try {
        const client = getJiraClient();
        const project = await client.getProject(projectKey);
        results.tests.push({
          name: 'Specific Project Access',
          success: true,
          message: `Project found: ${project.name}`,
          data: { key: project.key, name: project.name, id: project.id }
        });
      } catch (error: unknown) {
        results.tests.push({
          name: 'Specific Project Access',
          success: false,
          message: error instanceof Error ? error.message : String(error),
          error: error instanceof Error ? error.stack : String(error)
        });
      }
      
      // Test 5: Simple JQL query
      console.log(`[JIRA Test] Testing simple JQL query...`);
      try {
        const client = getJiraClient();
        const jql = `project = "${projectKey}"`;
        console.log(`[JIRA Test] JQL: ${jql}`);
        const searchResult = await client.searchIssues(jql, 0, 5);
        results.tests.push({
          name: 'Simple JQL Query (with quotes)',
          success: true,
          message: `Found ${searchResult.total} issues`,
          data: { 
            total: searchResult.total, 
            returned: searchResult.issues.length,
            jql: jql
          }
        });
      } catch (error: unknown) {
        results.tests.push({
          name: 'Simple JQL Query (with quotes)',
          success: false,
          message: error instanceof Error ? error.message : String(error),
          error: error instanceof Error ? error.stack : String(error)
        });
        
        // Try without quotes
        try {
          const client = getJiraClient();
          const jql = `project = ${projectKey}`;
          console.log(`[JIRA Test] Trying JQL without quotes: ${jql}`);
          const searchResult = await client.searchIssues(jql, 0, 5);
          results.tests.push({
            name: 'Simple JQL Query (without quotes)',
            success: true,
            message: `Found ${searchResult.total} issues`,
            data: { 
              total: searchResult.total, 
              returned: searchResult.issues.length,
              jql: jql
            }
          });
        } catch (error2: unknown) {
          results.tests.push({
            name: 'Simple JQL Query (without quotes)',
            success: false,
            message: error2 instanceof Error ? error2.message : String(error2),
            error: error2 instanceof Error ? error2.stack : String(error2)
          });
        }
      }
    }
    
    // Summary
    const successCount = results.tests.filter((t: any) => t.success).length;
    const totalTests = results.tests.length;
    
    return {
      statusCode: 200,
      body: {
        success: successCount === totalTests,
        summary: `${successCount}/${totalTests} tests passed`,
        results
      }
    };
    
  } catch (error: unknown) {
    console.error('[JIRA Test] Detailed test failed:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
        error: error instanceof Error ? error.stack : String(error)
      }
    };
  }
});