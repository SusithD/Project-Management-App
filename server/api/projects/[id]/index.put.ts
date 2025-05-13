import { defineEventHandler, readBody, getRequestHeader } from 'h3'
import { connectToDatabase } from '~/server/utils/database';
import { ObjectId } from 'mongodb';
import { sendProjectUpdateNotification } from '~/server/utils/email';
import { COLLECTIONS } from '~/server/utils/schemas';

// Define interfaces for type safety
interface User {
  id?: string;
  _id?: ObjectId | string;
  name?: string;
  email?: string;
  emailAddress?: string;
  mail?: string;
  displayName?: string;
}

interface NotificationRecipient {
  name: string;
  email?: string;
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
  reason?: string;
  result?: any; // Add result property to match the usage
}

interface NotificationResults {
  totalRecipients: number;
  notificationsSent: number;
  notificationsFailed: number;
  recipients: NotificationRecipient[];
}

/**
 * Update a project
 * 
 * @route PUT /api/projects/:id
 */
export default defineEventHandler(async (event) => {
  try {
    console.log('[Projects API - Update] Starting project update process');
    
    // Get project ID from params
    const id = event.context.params?.id;
    if (!id) {
      return {
        statusCode: 400,
        body: { error: 'Project ID is required' }
      };
    }
    
    console.log(`[Projects API - Update] Processing update for project ID: ${id}`);

    // Get update data from request body
    const projectData = await readBody(event);
    if (!projectData) {
      return {
        statusCode: 400,
        body: { error: 'Project data is required' }
      };
    }
    
    // Get authentication info
    const authHeader = getRequestHeader(event, 'Authorization');
    let currentUserName = 'System User';
    let currentUserId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract user info from token
      try {
        const token = authHeader.split(' ')[1];
        if (token && token.split('.').length === 3) {
          const base64Payload = token.split('.')[1];
          const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
          const tokenData = JSON.parse(payload);
          
          // Check various common JWT payload structures
          currentUserId = tokenData.userId || tokenData.sub || tokenData.id || tokenData.user_id || null;
          currentUserName = tokenData.name || tokenData.displayName || tokenData.preferred_username || 'System User';
          
          console.log('👤 Current user updating project:', { id: currentUserId, name: currentUserName });
        }
      } catch (error) {
        console.error('Error parsing auth token:', error);
      }
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Find the project first to compare changes
    let originalProject;
    try {
      console.log(`[Projects API - Update] Looking up project with ObjectId: ${id}`);
      originalProject = await db.collection('projects').findOne({ _id: new ObjectId(id) });
    } catch (e) {
      // If ObjectId conversion fails, try finding by numeric ID
      console.log(`[Projects API - Update] ObjectId lookup failed, trying numeric ID: ${id}`);
      originalProject = await db.collection('projects').findOne({ id: parseInt(id) });
    }
    
    if (!originalProject) {
      console.log(`[Projects API - Update] Project not found with ID: ${id}`);
      return {
        statusCode: 404,
        body: { error: 'Project not found' }
      };
    }
    
    console.log(`[Projects API - Update] Found project: "${originalProject.name}" (${originalProject._id})`);
    
    // Prepare update data (remove fields that shouldn't be updated directly)
    const updateData = { ...projectData };
    
    // Don't overwrite these fields directly
    delete updateData._id;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.files; // Files are managed separately
    delete updateData.updates; // Updates are managed separately

    // Ensure lastUpdated is current
    updateData.lastUpdated = new Date().toISOString().split('T')[0];
    
    // Track which fields were actually updated
    const updatedFields = Object.keys(updateData).filter(field => {
      // Compare with original value
      const changed = JSON.stringify(originalProject[field]) !== JSON.stringify(updateData[field]);
      if (changed) {
        console.log(`[Projects API - Update] Field changed: ${field}`);
        console.log(`  - From: ${JSON.stringify(originalProject[field])}`);
        console.log(`  - To:   ${JSON.stringify(updateData[field])}`);
      }
      return changed;
    });
    
    console.log('🔄 Fields being updated:', updatedFields);
    
    if (updatedFields.length === 0) {
      console.log('[Projects API - Update] No fields were actually changed');
      return {
        statusCode: 200,
        body: originalProject
      };
    }
    
    // Update the project
    console.log(`[Projects API - Update] Updating project document in database`);
    const result = await db.collection('projects').updateOne(
      { _id: originalProject._id },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      console.log(`[Projects API - Update] No document matched for update`);
      return {
        statusCode: 404,
        body: { error: 'Project not found' }
      };
    }
    
    console.log(`[Projects API - Update] Project updated successfully, matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);
    
    // Get the updated project
    const updatedProject = await db.collection('projects').findOne(
      { _id: originalProject._id }
    );
    
    // Ensure we found the project
    if (!updatedProject) {
      console.log(`[Projects API - Update] Failed to fetch updated project`);
      return {
        statusCode: 404,
        body: { error: 'Project not found after update' }
      };
    }
    
    // Track notification results
    const notificationResults: NotificationResults = {
      totalRecipients: 0,
      notificationsSent: 0,
      notificationsFailed: 0,
      recipients: []
    };
    
    // Send notifications to all assigned people
    try {
      console.log('📧 [Projects API - Update] Preparing to send update notifications');
      
      // Check email configuration 
      console.log('🔍 [Projects API - Update] Checking email configuration...');
      debugEmailConfig();

      // Verify the sendProjectUpdateNotification function exists
      if (typeof sendProjectUpdateNotification !== 'function') {
        console.error('❌ [Projects API - Update] sendProjectUpdateNotification is not a function!', typeof sendProjectUpdateNotification);
      } else {
        console.log('✅ [Projects API - Update] sendProjectUpdateNotification is available as a function');
      }
      
      // Collect all people associated with this project
      const recipientIds = new Set();
      
      // Add all possible assigned people
      if (updatedProject.assignedTo) {
        if (Array.isArray(updatedProject.assignedTo)) {
          console.log(`[Projects API - Update] Project has ${updatedProject.assignedTo.length} assigned users`);
          updatedProject.assignedTo.forEach(id => {
            if (id) {
              recipientIds.add(id);
              console.log(`[Projects API - Update] Added assignee: ${id}`);
            }
          });
        } else if (updatedProject.assignedTo) {
          recipientIds.add(updatedProject.assignedTo);
          console.log(`[Projects API - Update] Added single assignee: ${updatedProject.assignedTo}`);
        }
      } else {
        console.log(`[Projects API - Update] Project has no assignees`);
      }
      
      // Add responsible person
      if (updatedProject.responsiblePerson) {
        recipientIds.add(updatedProject.responsiblePerson);
        console.log(`[Projects API - Update] Added responsible person: ${updatedProject.responsiblePerson}`);
      }
      
      // Add project manager
      if (updatedProject.manager) {
        recipientIds.add(updatedProject.manager);
        console.log(`[Projects API - Update] Added project manager: ${updatedProject.manager}`);
      }
      
      // Add project owner
      if (updatedProject.owner) {
        recipientIds.add(updatedProject.owner);
        console.log(`[Projects API - Update] Added project owner: ${updatedProject.owner}`);
      }
      
      // Add team members if available
      if (updatedProject.team && Array.isArray(updatedProject.team)) {
        console.log(`[Projects API - Update] Project has ${updatedProject.team.length} team members`);
        updatedProject.team.forEach(member => {
          if (member) {
            recipientIds.add(member);
            console.log(`[Projects API - Update] Added team member: ${member}`);
          }
        });
      }
      
      console.log(`🔍 Found ${recipientIds.size} potential recipients for update notification`);
      
      // Remove the current user from notification recipients
      if (currentUserId) {
        console.log(`[Projects API - Update] Current user ID: ${currentUserId}, removing from recipients`);
        if (recipientIds.has(currentUserId)) {
          recipientIds.delete(currentUserId);
          console.log(`[Projects API - Update] Removed current user ID from recipients`);
        }
        if (recipientIds.has(currentUserId.toString())) {
          recipientIds.delete(currentUserId.toString());
          console.log(`[Projects API - Update] Removed current user ID string from recipients`);
        }
        console.log('ℹ️ Current user excluded from notifications');
      }
      
      notificationResults.totalRecipients = recipientIds.size;
      
      if (recipientIds.size > 0) {
        // Get user details for all recipients
        const usersCollection = db.collection(COLLECTIONS.USERS);
        const recipientsList = Array.from(recipientIds).map(String);
        
        console.log(`[Projects API - Update] Looking up users with IDs:`, recipientsList);
        
        // Try multiple ways to find users by ID
        let users: User[] = [];
        
        try {
          // First: Try normal ID lookup
          const idUsers = await usersCollection.find({ 
            id: { $in: recipientsList }
          }).toArray() as User[];
          
          users = users.concat(idUsers);
          console.log(`👥 Found ${idUsers.length} users by 'id' field`);
          
          // Log the found users
          idUsers.forEach(user => {
            console.log(`[Projects API - Update] Found user by 'id': ${user.name || user.id} (${user.email || user.emailAddress || user.mail || 'no email'})`);
          });
        } catch (err) {
          console.error(`[Projects API - Update] Error looking up users by id:`, err);
        }
        
        try {
          // Second: Try ObjectId lookup for valid ObjectId strings
          const validObjectIds = [];
          for (const idStr of recipientsList) {
            if (idStr && idStr.length === 24) {
              try {
                validObjectIds.push(new ObjectId(idStr));
              } catch (e) {
                // Skip invalid ObjectIds
              }
            }
          }
          
          if (validObjectIds.length > 0) {
            console.log(`[Projects API - Update] Looking up users by ObjectId, found ${validObjectIds.length} valid ObjectIds`);
            const objectIdUsers = await usersCollection.find({ 
              _id: { $in: validObjectIds }
            }).toArray();
            
            users = users.concat(objectIdUsers);
            console.log(`👥 Found ${objectIdUsers.length} users by ObjectId '_id' field`);
            
            // Log the found users
            objectIdUsers.forEach(user => {
              console.log(`[Projects API - Update] Found user by '_id': ${user.name || user._id} (${user.email || user.emailAddress || user.mail || 'no email'})`);
            });
          }
        } catch (err) {
          console.error(`[Projects API - Update] Error looking up users by ObjectId:`, err);
        }
        
        try {
          // Third: Try string ID lookup
          const stringIdLookup = await usersCollection.find({
            _id: { $in: recipientsList.map(id => new ObjectId(id)) }
          }).toArray();
          
          users = users.concat(stringIdLookup);
          console.log(`👥 Found ${stringIdLookup.length} users by string '_id' field`);
          
          // Log the found users
          stringIdLookup.forEach(user => {
            console.log(`[Projects API - Update] Found user by string '_id': ${user.name || user._id} (${user.email || user.emailAddress || user.mail || 'no email'})`);
          });
        } catch (err) {
          console.error(`[Projects API - Update] Error looking up users by string _id:`, err);
        }
        
        // Special case: Try direct lookup of each ID
        for (const userId of recipientsList) {
          try {
            const user = await usersCollection.findOne({ id: userId });
            if (user) {
              console.log(`[Projects API - Update] Found user by direct 'id' lookup: ${user.name || user.id}`);
              users.push(user);
            } else {
              try {
                if (userId.length === 24) {
                  const objUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
                  if (objUser) {
                    console.log(`[Projects API - Update] Found user by direct ObjectId '_id' lookup: ${objUser.name || objUser._id}`);
                    users.push(objUser);
                  }
                }
              } catch (error) {
                if (error instanceof Error) {
                  console.log(`[Projects API - Update] Error in direct ObjectId lookup for ${userId}: ${error.message}`);
                } else {
                  console.log(`[Projects API - Update] Error in direct ObjectId lookup for ${userId}:`, error);
                }
              }
            }
          } catch (error) {
            if (error instanceof Error) {
              console.log(`[Projects API - Update] Error in direct user lookup for ${userId}: ${error.message}`);
            } else {
              console.log(`[Projects API - Update] Error in direct user lookup for ${userId}:`, error);
            }
          }
        }
        
        // Deduplicate users based on email
        const uniqueUsers: User[] = [];
        const seenEmails = new Set();
        const seenIds = new Set();
        
        console.log(`[Projects API - Update] Deduplicating ${users.length} total found users`);
        
        for (const user of users) {
          const email = user.email || user.emailAddress || user.mail;
          const userId = user.id || (user._id ? user._id.toString() : null);
          
          // Skip if we've seen this user already
          if (userId && seenIds.has(userId)) {
            continue;
          }
          
          if (email && !seenEmails.has(email)) {
            seenEmails.add(email);
            if (userId) seenIds.add(userId);
            uniqueUsers.push(user);
            console.log(`[Projects API - Update] Added unique user: ${user.name || userId || 'unnamed'} (${email})`);
          } else if (userId && !seenIds.has(userId)) {
            seenIds.add(userId);
            uniqueUsers.push(user);
            console.log(`[Projects API - Update] Added unique user by ID: ${user.name || userId || 'unnamed'} (${email || 'no email'})`);
          }
        }
        
        console.log(`👥 Found ${uniqueUsers.length} unique users to notify after deduplication`);
        
        // Check if we have any users to notify
        if (uniqueUsers.length === 0) {
          console.log(`[Projects API - Update] ⚠️ WARNING: No users found to notify despite having ${recipientIds.size} recipient IDs`);
          console.log(`[Projects API - Update] Collection name used for users lookup: ${COLLECTIONS.USERS}`);
          
          // Inspect the users collection
          try {
            const sampleUsers = await usersCollection.find({}).limit(2).toArray();
            if (sampleUsers.length > 0) {
              console.log(`[Projects API - Update] Sample user from collection:`, JSON.stringify(sampleUsers[0]));
            } else {
              console.log(`[Projects API - Update] Users collection appears to be empty`);
            }
          } catch (err) {
            console.error(`[Projects API - Update] Error inspecting users collection:`, err);
          }
        }
        
        // Send notifications to each user
        for (const user of uniqueUsers) {
          const email = user.email || user.emailAddress || user.mail;
          const name = user.name || user.displayName || 'Team Member';
          
          if (email) {
            console.log(`[Projects API - Update] Found assigned user: ${name} (${email})`);
            console.log(`[Projects API - Update] Calling sendProjectUpdateNotification for ${email}`);
            
            try {
              console.log(`📧 [Email Service] Sending project update notification to ${email} for project '${updatedProject.name}'`);
              
              const emailResult = await sendProjectUpdateNotification(
                email,
                name,
                updatedProject.name || `Project #${updatedProject.id || updatedProject._id}`,
                updatedProject.id || updatedProject._id.toString(),
                updatedFields, // Pass the updated field names
                currentUserName
              );
              
              console.log(`[Projects API - Update] Email notification result:`, emailResult);
              
              notificationResults.notificationsSent += 1;
              notificationResults.recipients.push({
                name,
                email,
                status: 'sent',
                result: emailResult
              });
            } catch (emailError) {
              console.error(`❌ [Projects API - Update] Failed to send notification to ${name}:`, emailError);
              if (emailError instanceof Error) {
                console.error('Stack trace for email error:', emailError.stack);
              }
              
              notificationResults.notificationsFailed += 1;
              notificationResults.recipients.push({
                name,
                email,
                status: 'failed',
                error: emailError instanceof Error ? emailError.message : 'Unknown error'
              });
            }
          } else {
            console.log(`⚠️ [Projects API - Update] User ${user.name || user._id || 'unknown'} has no email address`);
            notificationResults.recipients.push({
              name: user.name || user.displayName || 'Unknown User',
              status: 'skipped',
              reason: 'No email address'
            });
          }
        }
      } else {
        console.log('[Projects API - Update] No recipients to notify after filtering');
      }
    } catch (notificationError) {
      console.error('❌ Error sending project update notifications:', notificationError);
      if (notificationError instanceof Error) {
        console.error('Stack trace:', notificationError.stack);
      } else {
        console.error('Stack trace: Unknown error type');
      }
      // Don't fail the API call if notifications fail
    }
    
    console.log(`[Projects API - Update] Email notifications sent to ${notificationResults.notificationsSent} users`);
    
    // Format for response
    const formattedProject = {
      ...updatedProject,
      id: updatedProject._id.toString()
    };
    // Use type assertion to avoid TypeScript error
    delete (formattedProject as Record<string, any>)._id;

    console.log('[Projects API - Update] Project update completed successfully');
    
    // Return detailed response for debugging
    return {
      statusCode: 200,
      body: {
        ...formattedProject,
        _notificationsSent: notificationResults.notificationsSent,
        _notificationsAttempted: notificationResults.totalRecipients,
        _notificationsFailed: notificationResults.notificationsFailed,
        _updatedFields: updatedFields
      }
    };
  } catch (error) {
    console.error('Error updating project:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Stack trace: Unknown error type');
    }
    return {
      statusCode: 500,
      body: { error: 'Failed to update project' }
    };
  }
});

// Add this debug function right after the interfaces
function debugEmailConfig() {
  try {
    // Log environment variables related to email (with sensitive parts redacted)
    const emailConfig = {
      EMAIL_HOST: process.env.EMAIL_HOST ? '✓ Set' : '❌ Not set',
      EMAIL_PORT: process.env.EMAIL_PORT ? '✓ Set' : '❌ Not set',
      EMAIL_USER: process.env.EMAIL_USER ? '✓ Set (redacted)' : '❌ Not set',
      EMAIL_PASS: process.env.EMAIL_PASS ? '✓ Set (redacted)' : '❌ Not set',
      EMAIL_FROM: process.env.EMAIL_FROM || '❌ Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not specified'
    };
    console.log('📧 [Debug] Email configuration status:', emailConfig);
    return true;
  } catch (error) {
    console.error('❌ [Debug] Error checking email configuration:', error);
    return false;
  }
}