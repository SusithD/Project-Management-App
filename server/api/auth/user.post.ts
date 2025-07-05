import { defineEventHandler, createError, readBody } from 'h3';
import { getUserWithRole, checkUserPermission } from '~/server/utils/auth-roles';
import { getRoleByEmail, ROLES } from '~/server/config/roles';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { email, name, accessToken, idToken } = body;
    
    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      });
    }
    
    // Get or create user with proper role assignment
    const user = await getUserWithRole(email, {
      name: name || email.split('@')[0],
      // Add any other user data from the OAuth response
    });
    
    // Return user data with role information
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roleName: ROLES[user.role].name,
        permissions: ROLES[user.role].permissions,
        lastActive: user.lastActive,
        joinedAt: user.joinedAt
      }
    };
  } catch (error) {
    console.error('User authentication error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to authenticate user'
    });
  }
});