// Authentication redirect handler
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    
    // Extract query parameters
    const code = query.code as string
    const error = query.error as string
    const errorDescription = query.error_description as string
    
    // Handle error from authentication provider
    if (error) {
      console.error(`Auth error: ${error}`, errorDescription)
      return sendRedirect(
        event, 
        `/auth/redirect?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`
      )
    }
    
    // Validate authorization code
    if (!code) {
      return sendRedirect(
        event, 
        '/auth/redirect?error=no_code&error_description=Authorization+code+is+missing'
      )
    }
    
    // Get the configuration
    const config = useRuntimeConfig()
    
    // Store the authorization code temporarily
    setCookie(event, 'auth_code', code, {
      path: '/',
      httpOnly: false, // Set to true in production with proper token exchange
      maxAge: 60 * 5, // 5 minutes
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })
    
    // Redirect to the frontend auth handler
    return sendRedirect(event, '/auth/redirect')
  } catch (error) {
    console.error('OAuth redirect error:', error)
    return sendRedirect(
      event, 
      `/auth/redirect?error=server_error&error_description=${encodeURIComponent('Server error processing authentication')}`
    )
  }
})