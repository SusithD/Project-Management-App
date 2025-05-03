export default defineEventHandler(async (event) => {
  try {
    // Get authorization header
    const authorization = getRequestHeader(event, 'authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: {
          error: 'Unauthorized',
          message: 'Missing or invalid authorization token'
        }
      }
    }
    
    const token = authorization.substring(7)
    
    // In a real app, you would verify the token with Microsoft Identity Platform
    // For demo purposes, we'll return a mock user
    return {
      id: '12345',
      displayName: 'John Doe',
      userPrincipalName: 'john.doe@company.com',
      mail: 'john.doe@company.com',
      role: 'business_analyst',
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return {
      statusCode: 500,
      body: {
        error: 'Internal Server Error',
        message: 'Failed to verify token'
      }
    }
  }
})