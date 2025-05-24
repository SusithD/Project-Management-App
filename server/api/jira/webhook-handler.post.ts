import { defineEventHandler, readBody, getHeader } from 'h3';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS } from '~/server/utils/schemas';
import { ObjectId } from 'mongodb';
import type { JiraWebhookEvent } from '~/types/jira';
import crypto from 'crypto';

/**
 * Handle incoming JIRA webhook events
 * 
 * @route POST /api/jira/webhook-handler
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as JiraWebhookEvent;
    const signature = getHeader(event, 'x-atlassian-webhook-identifier');
    
    console.log(`[JIRA Webhook] Received event: ${body.webhookEvent}`);
    
    // Validate webhook authenticity (optional but recommended)
    // You would store the webhook secret when creating the webhook
    
    // Store webhook event for processing
    const { db } = await connectToDatabase();
    const webhookEventsCollection = db.collection('jira_webhook_events');
    
    await webhookEventsCollection.insertOne({
      ...body,
      receivedAt: new Date().toISOString(),
      processed: false,
      signature
    });
    
    // Process the webhook event
    await processWebhookEvent(body);
    
    return {
      statusCode: 200,
      body: {
        success: true,
        message: 'Webhook processed successfully'
      }
    };
    
  } catch (error) {
    console.error('[JIRA Webhook] Error processing webhook:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: 'Failed to process webhook'
      }
    };
  }
});

/**
 * Process different types of webhook events
 */
async function processWebhookEvent(webhookEvent: JiraWebhookEvent) {
  const { db } = await connectToDatabase();
  const projectsCollection = db.collection(COLLECTIONS.PROJECTS);
  
  switch (webhookEvent.webhookEvent) {
    case 'jira:issue_updated':
    case 'jira:issue_created':
      await handleIssueEvent(webhookEvent, projectsCollection);
      break;
      
    case 'jira:issue_deleted':
      await handleIssueDeleted(webhookEvent, projectsCollection);
      break;
      
    case 'comment_created':
    case 'comment_updated':
      await handleCommentEvent(webhookEvent, projectsCollection);
      break;
      
    default:
      console.log(`[JIRA Webhook] Unhandled event type: ${webhookEvent.webhookEvent}`);
  }
}

/**
 * Handle issue creation/update events
 */
async function handleIssueEvent(webhookEvent: JiraWebhookEvent, projectsCollection: any) {
  if (!webhookEvent.issue) return;
  
  const issue = webhookEvent.issue;
  const projectKey = issue.fields.project.key;
  
  // Find projects linked to this JIRA project
  const linkedProjects = await projectsCollection.find({
    'jiraIntegration.projectKey': projectKey,
    'jiraIntegration.enabled': true
  }).toArray();
  
  for (const project of linkedProjects) {
    try {
      // Check if bi-directional sync is enabled
      const syncConfig = project.jiraIntegration.bidirectionalSync;
      if (!syncConfig?.enabled) continue;
      
      // Trigger bi-directional sync for this project and issue
      await triggerBidirectionalSync(project._id.toString(), issue.key);
      
      console.log(`[JIRA Webhook] Triggered sync for project ${project.name} and issue ${issue.key}`);
      
    } catch (error) {
      console.error(`[JIRA Webhook] Error syncing project ${project.name}:`, error);
    }
  }
}

/**
 * Handle issue deletion events
 */
async function handleIssueDeleted(webhookEvent: JiraWebhookEvent, projectsCollection: any) {
  if (!webhookEvent.issue) return;
  
  const issue = webhookEvent.issue;
  const projectKey = issue.fields.project.key;
  
  // Find linked projects and update their sync stats
  await projectsCollection.updateMany(
    {
      'jiraIntegration.projectKey': projectKey,
      'jiraIntegration.enabled': true
    },
    {
      $set: {
        'jiraIntegration.lastWebhookEvent': {
          type: 'issue_deleted',
          issueKey: issue.key,
          timestamp: new Date().toISOString()
        }
      }
    }
  );
  
  console.log(`[JIRA Webhook] Processed issue deletion: ${issue.key}`);
}

/**
 * Handle comment events
 */
async function handleCommentEvent(webhookEvent: JiraWebhookEvent, projectsCollection: any) {
  if (!webhookEvent.issue) return;
  
  const issue = webhookEvent.issue;
  const projectKey = issue.fields.project.key;
  
  // Update last activity timestamp for linked projects
  await projectsCollection.updateMany(
    {
      'jiraIntegration.projectKey': projectKey,
      'jiraIntegration.enabled': true
    },
    {
      $set: {
        'jiraIntegration.lastActivity': new Date().toISOString(),
        'jiraIntegration.lastWebhookEvent': {
          type: webhookEvent.webhookEvent,
          issueKey: issue.key,
          timestamp: new Date().toISOString()
        }
      }
    }
  );
  
  console.log(`[JIRA Webhook] Processed comment event for issue: ${issue.key}`);
}

/**
 * Trigger bi-directional sync
 */
async function triggerBidirectionalSync(projectId: string, jiraIssueKey: string) {
  try {
    // This would typically be an async job or queue
    // For now, we'll make a direct API call
    const response = await fetch('/api/jira/bidirectional-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        jiraIssueKey,
        resolveConflicts: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
    
    console.log(`[JIRA Webhook] Bi-directional sync completed for ${projectId}/${jiraIssueKey}`);
    
  } catch (error) {
    console.error(`[JIRA Webhook] Failed to trigger sync:`, error);
  }
}