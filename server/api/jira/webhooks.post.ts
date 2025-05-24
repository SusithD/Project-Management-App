import { defineEventHandler, readBody } from 'h3';
import { getJiraClient } from '~/server/utils/jira';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS } from '~/server/utils/schemas';
import type { JiraWebhookConfig } from '~/types/jira';

/**
 * Manage JIRA webhooks
 * 
 * @route POST /api/jira/webhooks
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { action, webhookConfig, webhookId } = body;
    
    if (!action) {
      return {
        statusCode: 400,
        body: {
          success: false,
          message: 'Action is required (create, list, delete)'
        }
      };
    }
    
    const jiraClient = getJiraClient();
    const config = useRuntimeConfig();
    
    switch (action) {
      case 'create':
        if (!webhookConfig) {
          return {
            statusCode: 400,
            body: {
              success: false,
              message: 'Webhook configuration is required for creation'
            }
          };
        }
        
        // Set webhook URL to point to our handler
        const webhookUrl = `${config.public.appUrl || 'http://localhost:3000'}/api/jira/webhook-handler`;
        
        const newWebhook = await jiraClient.createWebhook({
          name: webhookConfig.name || 'Project Management App Webhook',
          url: webhookUrl,
          events: webhookConfig.events || [
            'jira:issue_created',
            'jira:issue_updated',
            'jira:issue_deleted',
            'comment_created',
            'comment_updated'
          ],
          filters: webhookConfig.filters || {
            issueRelatedEventsSection: 'ALL'
          }
        });
        
        // Store webhook info in database
        const { db } = await connectToDatabase();
        const webhooksCollection = db.collection('jira_webhooks');
        
        await webhooksCollection.insertOne({
          jiraWebhookId: newWebhook.id,
          name: newWebhook.name,
          url: newWebhook.url,
          events: newWebhook.events,
          active: true,
          createdAt: new Date().toISOString()
        });
        
        console.log(`[JIRA API] Created webhook: ${newWebhook.id}`);
        
        return {
          statusCode: 201,
          body: {
            success: true,
            message: 'Webhook created successfully',
            webhook: newWebhook
          }
        };
        
      case 'list':
        const webhooks = await jiraClient.getWebhooks();
        
        return {
          statusCode: 200,
          body: {
            success: true,
            webhooks
          }
        };
        
      case 'delete':
        if (!webhookId) {
          return {
            statusCode: 400,
            body: {
              success: false,
              message: 'Webhook ID is required for deletion'
            }
          };
        }
        
        await jiraClient.deleteWebhook(webhookId);
        
        // Remove from database
        const { db: deleteDb } = await connectToDatabase();
        const deleteWebhooksCollection = deleteDb.collection('jira_webhooks');
        
        await deleteWebhooksCollection.deleteOne({
          jiraWebhookId: webhookId
        });
        
        console.log(`[JIRA API] Deleted webhook: ${webhookId}`);
        
        return {
          statusCode: 200,
          body: {
            success: true,
            message: 'Webhook deleted successfully'
          }
        };
        
      default:
        return {
          statusCode: 400,
          body: {
            success: false,
            message: 'Invalid action. Supported actions: create, list, delete'
          }
        };
    }
    
  } catch (error) {
    console.error('[JIRA API] Error managing webhooks:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to manage webhooks'
      }
    };
  }
});