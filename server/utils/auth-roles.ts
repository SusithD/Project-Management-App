import { getRoleByEmail, hasPermission, ROLES } from '../config/roles';
import { connectToDatabase } from './database';
import { COLLECTIONS } from './schemas';
import type { User } from '../models/user';
import { getRequestHeader, createError } from 'h3';

/**
 * Get or create user with role assignment based on email
 */
export async function getUserWithRole(email: string, userData: Partial<User>): Promise<User> {
  const { db } = await connectToDatabase();
  
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();
  
  // Determine role based on email
  const assignedRole = getRoleByEmail(normalizedEmail);
  
  // Check if user exists
  let user = await db.collection(COLLECTIONS.USERS).findOne({ email: normalizedEmail }) as User | null;
  
  if (user) {
    // Update existing user's role if it has changed
    if (user.role !== assignedRole) {
      await db.collection(COLLECTIONS.USERS).updateOne(
        { email: normalizedEmail },
        { 
          $set: { 
            role: assignedRole,
            lastRoleUpdate: new Date().toISOString(),
            lastActive: new Date().toISOString()
          } 
        }
      );
      user.role = assignedRole;
      user.lastRoleUpdate = new Date().toISOString();
    }
    
    // Update last active time
    await db.collection(COLLECTIONS.USERS).updateOne(
      { email: normalizedEmail },
      { $set: { lastActive: new Date().toISOString() } }
    );
  } else {
    // Create new user with assigned role
    const newUser: User = {
      id: userData.id || generateUserId(userData.name || 'User'),
      name: userData.name || 'User',
      email: normalizedEmail,
      role: assignedRole,
      availability: {
        status: 'available',
        allocatedProjects: 0,
        workload: 0
      },
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      lastRoleUpdate: new Date().toISOString(),
      ...userData
    };
    
    await db.collection(COLLECTIONS.USERS).insertOne(newUser);
    user = newUser;
  }
  
  return user as User;
}

/**
 * Check if user has permission for a specific action on a resource
 */
export function checkUserPermission(userRole: keyof typeof ROLES, resource: string, action: string): boolean {
  return hasPermission(userRole, resource, action);
}

/**
 * Middleware to verify user permissions
 */
export function requirePermission(resource: string, action: string) {
  return async (event: any) => {
    try {
      // Extract user info from request
      const authHeader = getRequestHeader(event, 'Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized - No valid token provided'
        });
      }
      
      // Get user from token or session
      const userEmail = await getUserEmailFromToken(authHeader);
      if (!userEmail) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized - Invalid token'
        });
      }
      
      // Get user role
      const user = await getUserByEmail(userEmail);
      if (!user) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Forbidden - User not found'
        });
      }
      
      // Check permission
      if (!checkUserPermission(user.role, resource, action)) {
        throw createError({
          statusCode: 403,
          statusMessage: `Forbidden - Insufficient permissions for ${action} on ${resource}`
        });
      }
      
      // Add user to event context
      event.context.user = user;
      return true;
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Get user by email from database
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const { db } = await connectToDatabase();
  const user = await db.collection(COLLECTIONS.USERS).findOne({ 
    email: email.toLowerCase().trim() 
  }) as User | null;
  return user;
}

/**
 * Extract user email from authorization token
 */
async function getUserEmailFromToken(authHeader: string): Promise<string | null> {
  try {
    const token = authHeader.split(' ')[1];
    if (!token || token.split('.').length !== 3) {
      return null;
    }
    
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    const tokenData = JSON.parse(payload);
    
    // Extract email from various possible fields
    return tokenData.email || 
           tokenData.upn || 
           tokenData.preferred_username || 
           tokenData.unique_name || 
           null;
  } catch (error) {
    console.error('Error extracting email from token:', error);
    return null;
  }
}

/**
 * Generate a user ID from name
 */
function generateUserId(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20) + '-' + Math.random().toString(36).substring(2, 8);
}