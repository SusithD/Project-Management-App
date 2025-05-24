import { defineEventHandler } from 'h3';
import { testJiraConnection } from '~/server/utils/jira';

/**
 * Test JIRA connection and configuration
 * 
 * @route GET /api/jira/test
 */
export default defineEventHandler(async (event) => {
  try {
    console.log('[JIRA API] Testing JIRA connection...');
    
    const result = await testJiraConnection();
    
    if (result.success) {
      console.log('[JIRA API] ✅ JIRA connection successful');
      return {
        statusCode: 200,
        body: {
          success: true,
          message: result.message,
          config: result.config
        }
      };
    } else {
      console.log('[JIRA API] ❌ JIRA connection failed:', result.message);
      return {
        statusCode: 400,
        body: {
          success: false,
          message: result.message
        }
      };
    }
  } catch (error) {
    console.error('[JIRA API] Error testing JIRA connection:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test JIRA connection'
      }
    };
  }
});