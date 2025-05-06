import { defineEventHandler, readBody, createError } from 'h3';
import { connectToDatabase } from '~/server/utils/database';
import { COLLECTIONS, User } from '~/server/utils/schemas';

// API endpoint for adding a new user to the database
export default defineEventHandler(async (event) => {
  try {
    // Get request body
    const body = await readBody(event);
    
    // Validate required fields
    if (!body.id || !body.name || !body.email || !body.role) {
      return createError({
        statusCode: 400,
        message: 'Missing required user information'
      });
    }

    // Create new user object
    const newUser: User = {
      id: body.id,
      name: body.name,
      email: body.email,
      role: body.role,
      avatar: null,
      createdAt: new Date().toISOString()
    };

    // Connect to database
    const { db } = await connectToDatabase();
    
    // Check if user with the same ID or email already exists
    const existingUser = await db.collection(COLLECTIONS.USERS).findOne({
      $or: [
        { id: newUser.id },
        { email: newUser.email }
      ]
    });

    if (existingUser) {
      return createError({
        statusCode: 409,
        message: 'User with the same ID or email already exists'
      });
    }

    // Insert new user into database
    const result = await db.collection(COLLECTIONS.USERS).insertOne(newUser);
    
    return {
      success: true,
      user: newUser,
      message: 'User added successfully'
    };
  } catch (error) {
    console.error('Error adding user:', error);
    return createError({
      statusCode: 500,
      message: 'Failed to add user'
    });
  }
});