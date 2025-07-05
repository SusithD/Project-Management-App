import { getRoleByEmail, hasPermission, ROLES, EMAIL_ROLE_MAPPING, DEFAULT_ROLE } from '../config/roles';
import { connectToDatabase } from './database';
import { COLLECTIONS } from './schemas';
import type { User } from '../models/user';
import { getRequestHeader, createError } from 'h3';

/**
 * Get role for email - checks database first, then falls back to config
 */
async function getRoleForEmail(email: string): Promise<keyof typeof ROLES> {
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    // First check database for email role mappings
    const { db } = await connectToDatabase();
    const mapping = await db.collection('email_role_mappings')
      .findOne({ email: normalizedEmail });
    
    if (mapping && ROLES[mapping.role]) {
      return mapping.role;
    }
  } catch (error) {
    console.error('Error checking database for email role mapping:', error);
  }
  
  // Fall back to hardcoded config
  return EMAIL_ROLE_MAPPING[normalizedEmail] || DEFAULT_ROLE;
}

/**
 * Get or create user with role assignment based on email
 */
export async function getUserWithRole(email: string, userData: Partial<User>): Promise<User> {
  const { db } = await connectToDatabase();
  
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();
  
  // Determine role based on database mapping or config
  const assignedRole = await getRoleForEmail(normalizedEmail);
  
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
      
      // Log automatic role change
      try {
        await db.collection('role_changes').insertOne({
          userId: user._id || user.id,
          fromRole: user.role,
          toRole: assignedRole,
          changedAt: new Date().toISOString(),
          changedBy: 'System (Email Mapping)',
          changedByEmail: 'system@automatic',
          reason: 'Automatic role assignment based on email mapping',
          userEmail: normalizedEmail,
          userName: user.name,
          fromRoleName: ROLES[user.role]?.name || user.role,
          toRoleName: ROLES[assignedRole]?.name || assignedRole,
          hierarchyChange: (ROLES[assignedRole]?.hierarchy || 0) - (ROLES[user.role]?.hierarchy || 0),
          createdAt: new Date().toISOString(),
          isAutomatic: true
        });
      } catch (historyError) {
        console.error('Failed to log automatic role change:', historyError);
      }
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
      createdAt: new Date().toISOString(),
      ...userData
    };
    
    await db.collection(COLLECTIONS.USERS).insertOne(newUser);
    user = newUser;
    
    // Log initial role assignment
    try {
      await db.collection('role_changes').insertOne({
        userId: newUser._id || newUser.id,
        fromRole: null,
        toRole: assignedRole,
        changedAt: new Date().toISOString(),
        changedBy: 'System (Email Mapping)',
        changedByEmail: 'system@automatic',
        reason: 'Initial role assignment based on email mapping',
        userEmail: normalizedEmail,
        userName: newUser.name,
        fromRoleName: null,
        toRoleName: ROLES[assignedRole]?.name || assignedRole,
        hierarchyChange: ROLES[assignedRole]?.hierarchy || 0,
        createdAt: new Date().toISOString(),
        isAutomatic: true,
        isInitialAssignment: true
      });
    } catch (historyError) {
      console.error('Failed to log initial role assignment:', historyError);
    }
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
    if (!token) {
      return null;
    }
    
    // Handle different token formats
    if (token.split('.').length === 3) {
      // JWT token format
      const base64Payload = token.split('.')[1];
      const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
      const tokenData = JSON.parse(payload);
      
      // Extract email from various possible fields
      return tokenData.email || 
             tokenData.upn || 
             tokenData.preferred_username || 
             tokenData.unique_name || 
             null;
    } else {
      // For development/testing - allow simple email format
      if (token.includes('@')) {
        return token;
      }
      return null;
    }
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

/**
 * Get current user from authorization token
 */
export async function getCurrentUser(event: any): Promise<User | null> {
  try {
    // Extract user info from request
    const authHeader = getRequestHeader(event, 'Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    // Get user email from token
    const userEmail = await getUserEmailFromToken(authHeader);
    if (!userEmail) {
      return null;
    }
    
    // Get user from database
    const user = await getUserByEmail(userEmail);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Enhanced permission check with user context
 */
export async function checkUserCanManageRole(currentUser: User, targetRole: string, newRole: string): Promise<boolean> {
  // Super admins can manage any role
  if (currentUser.role === 'SUPER_ADMIN') {
    return true;
  }
  
  // Get hierarchy levels
  const currentUserLevel = ROLES[currentUser.role]?.hierarchy || 0;
  const targetRoleLevel = ROLES[targetRole]?.hierarchy || 0;
  const newRoleLevel = ROLES[newRole]?.hierarchy || 0;
  
  // Can only manage users below their level
  if (targetRoleLevel >= currentUserLevel) {
    return false;
  }
  
  // Can only assign roles below their level
  if (newRoleLevel >= currentUserLevel) {
    return false;
  }
  
  return true;
}

/**
 * Get available roles that a user can assign
 */
export function getAssignableRoles(userRole: keyof typeof ROLES): Array<{ key: string; role: typeof ROLES[keyof typeof ROLES] }> {
  const userLevel = ROLES[userRole]?.hierarchy || 0;
  
  if (userRole === 'SUPER_ADMIN') {
    // Super admins can assign any role
    return Object.entries(ROLES).map(([key, role]) => ({ key, role }));
  }
  
  // Others can only assign roles below their level
  return Object.entries(ROLES)
    .filter(([, role]) => role.hierarchy < userLevel)
    .map(([key, role]) => ({ key, role }));
}