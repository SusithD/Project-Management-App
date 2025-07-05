import { defineEventHandler, createError, readBody, getRouterParam, getRequestHeader } from 'h3';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS } from '~/server/utils/schemas';
import { checkUserPermission, getUserByEmail } from '~/server/utils/auth-roles';
import { ROLES, getRoleByEmail } from '~/server/config/roles';

export default defineEventHandler(async (event) => {
  try {
    const userId = getRouterParam(event, 'id');
    const body = await readBody(event);
    const { role: newRole } = body;

    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required'
      });
    }

    if (!newRole || !ROLES[newRole]) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Valid role is required'
      });
    }

    // Get current user from authorization header
    const authHeader = getRequestHeader(event, 'Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - No valid token provided'
      });
    }

    // Extract current user email from token
    const token = authHeader.split(' ')[1];
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    const tokenData = JSON.parse(payload);
    const currentUserEmail = tokenData.email || tokenData.upn || tokenData.preferred_username;

    if (!currentUserEmail) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Invalid token'
      });
    }

    // Get current user from database
    const currentUser = await getUserByEmail(currentUserEmail);
    if (!currentUser) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden - User not found'
      });
    }

    // Check if current user has permission to update user roles
    if (!checkUserPermission(currentUser.role, 'users', 'update')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden - Insufficient permissions to update user roles'
      });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Get the target user
    const targetUser = await db.collection(COLLECTIONS.USERS).findOne({ id: userId });
    if (!targetUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      });
    }

    // Additional permission checks for role hierarchy
    const currentUserLevel = ROLES[currentUser.role]?.hierarchy || 0;
    const targetUserLevel = ROLES[targetUser.role]?.hierarchy || 0;
    const newRoleLevel = ROLES[newRole]?.hierarchy || 0;

    // Super admins can change anyone's role
    if (currentUser.role !== 'SUPER_ADMIN') {
      // Non-super admins can only change roles of users below their level
      if (targetUserLevel >= currentUserLevel) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Forbidden - Cannot modify roles of users at or above your level'
        });
      }

      // Non-super admins cannot assign roles at or above their level
      if (newRoleLevel >= currentUserLevel) {
        throw createError({
          statusCode: 403,
          statusMessage: 'Forbidden - Cannot assign roles at or above your level'
        });
      }
    }

    // Update user role
    const updateResult = await db.collection(COLLECTIONS.USERS).updateOne(
      { id: userId },
      { 
        $set: { 
          role: newRole,
          lastRoleUpdate: new Date().toISOString(),
          lastModifiedBy: currentUser.email
        } 
      }
    );

    if (updateResult.matchedCount === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      });
    }

    // Get updated user data
    const updatedUser = await db.collection(COLLECTIONS.USERS).findOne({ id: userId });

    if (!updatedUser) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to retrieve updated user data'
      });
    }

    return {
      success: true,
      message: 'User role updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        roleName: ROLES[updatedUser.role].name,
        lastRoleUpdate: updatedUser.lastRoleUpdate,
        lastModifiedBy: updatedUser.lastModifiedBy
      }
    };
  } catch (error: any) {
    console.error('Error updating user role:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user role'
    });
  }
});