import { defineEventHandler, createError, readBody, getQuery } from 'h3';
import { connectToDatabase } from '~/server/utils/database';
import { requirePermission, getCurrentUser } from '~/server/utils/auth-roles';
import { ROLES } from '~/server/config/roles';
import { ObjectId } from 'mongodb';

export default defineEventHandler(async (event) => {
  try {
    const method = event.node.req.method;
    
    // Only Super Admins can manage email role mappings
    await requirePermission('users', 'create')(event);
    
    const currentUser = await getCurrentUser(event);
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only Super Admins can manage email role mappings'
      });
    }

    const { db } = await connectToDatabase();

    switch (method) {
      case 'GET':
        return await getEmailRoleMappings(db);
      
      case 'POST':
        const createData = await readBody(event);
        return await createEmailRoleMapping(db, createData, currentUser);
      
      case 'PUT':
        const updateData = await readBody(event);
        return await updateEmailRoleMapping(db, updateData, currentUser);
      
      case 'DELETE':
        const query = getQuery(event);
        return await deleteEmailRoleMapping(db, query.email as string, currentUser);
      
      default:
        throw createError({
          statusCode: 405,
          statusMessage: 'Method not allowed'
        });
    }
  } catch (error: any) {
    console.error('Error managing email role mappings:', error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to manage email role mappings'
    });
  }
});

async function getEmailRoleMappings(db: any) {
  const mappings = await db.collection('email_role_mappings')
    .find({})
    .sort({ email: 1 })
    .toArray();

  return {
    success: true,
    mappings: mappings.map((mapping: any) => ({
      id: mapping._id.toString(),
      email: mapping.email,
      role: mapping.role,
      roleName: ROLES[mapping.role]?.name || mapping.role,
      hierarchy: ROLES[mapping.role]?.hierarchy || 0,
      createdAt: mapping.createdAt,
      createdBy: mapping.createdBy,
      lastModified: mapping.lastModified,
      lastModifiedBy: mapping.lastModifiedBy
    })),
    availableRoles: Object.entries(ROLES).map(([key, role]) => ({
      key,
      name: role.name,
      hierarchy: role.hierarchy
    }))
  };
}

async function createEmailRoleMapping(db: any, data: any, currentUser: any) {
  const { email, role, reason } = data;

  if (!email || !role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and role are required'
    });
  }

  if (!ROLES[role]) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid role specified'
    });
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Check if mapping already exists
  const existingMapping = await db.collection('email_role_mappings')
    .findOne({ email: normalizedEmail });

  if (existingMapping) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email mapping already exists'
    });
  }

  const now = new Date().toISOString();
  const newMapping = {
    email: normalizedEmail,
    role: role,
    reason: reason || 'Created via admin interface',
    createdAt: now,
    createdBy: currentUser.email,
    lastModified: now,
    lastModifiedBy: currentUser.email
  };

  const result = await db.collection('email_role_mappings').insertOne(newMapping);

  // Log the change
  await db.collection('email_role_mapping_changes').insertOne({
    action: 'CREATE',
    email: normalizedEmail,
    role: role,
    reason: reason || 'Created via admin interface',
    changedAt: now,
    changedBy: currentUser.email,
    changedByName: currentUser.name
  });

  return {
    success: true,
    message: `Email mapping created for ${normalizedEmail}`,
    mapping: {
      id: result.insertedId.toString(),
      email: normalizedEmail,
      role: role,
      roleName: ROLES[role].name,
      hierarchy: ROLES[role].hierarchy,
      createdAt: now,
      createdBy: currentUser.email
    }
  };
}

async function updateEmailRoleMapping(db: any, data: any, currentUser: any) {
  const { id, email, role, reason } = data;

  if (!id || !email || !role) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID, email, and role are required'
    });
  }

  if (!ROLES[role]) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid role specified'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  // Get existing mapping
  const existingMapping = await db.collection('email_role_mappings')
    .findOne({ _id: new ObjectId(id) });

  if (!existingMapping) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Email mapping not found'
    });
  }

  const now = new Date().toISOString();
  const updateResult = await db.collection('email_role_mappings').updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        email: normalizedEmail,
        role: role,
        lastModified: now,
        lastModifiedBy: currentUser.email
      }
    }
  );

  if (updateResult.matchedCount === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Email mapping not found'
    });
  }

  // Log the change
  await db.collection('email_role_mapping_changes').insertOne({
    action: 'UPDATE',
    email: normalizedEmail,
    oldRole: existingMapping.role,
    newRole: role,
    reason: reason || 'Updated via admin interface',
    changedAt: now,
    changedBy: currentUser.email,
    changedByName: currentUser.name
  });

  return {
    success: true,
    message: `Email mapping updated for ${normalizedEmail}`,
    mapping: {
      id: id,
      email: normalizedEmail,
      role: role,
      roleName: ROLES[role].name,
      hierarchy: ROLES[role].hierarchy,
      lastModified: now,
      lastModifiedBy: currentUser.email
    }
  };
}

async function deleteEmailRoleMapping(db: any, email: string, currentUser: any) {
  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  // Get existing mapping
  const existingMapping = await db.collection('email_role_mappings')
    .findOne({ email: normalizedEmail });

  if (!existingMapping) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Email mapping not found'
    });
  }

  // Don't allow deletion of current user's mapping
  if (normalizedEmail === currentUser.email.toLowerCase()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot delete your own email mapping'
    });
  }

  const deleteResult = await db.collection('email_role_mappings').deleteOne({
    email: normalizedEmail
  });

  if (deleteResult.deletedCount === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Email mapping not found'
    });
  }

  const now = new Date().toISOString();

  // Log the change
  await db.collection('email_role_mapping_changes').insertOne({
    action: 'DELETE',
    email: normalizedEmail,
    role: existingMapping.role,
    reason: 'Deleted via admin interface',
    changedAt: now,
    changedBy: currentUser.email,
    changedByName: currentUser.name
  });

  return {
    success: true,
    message: `Email mapping deleted for ${normalizedEmail}`
  };
}