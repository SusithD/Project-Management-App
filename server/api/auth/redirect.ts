export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    
    // Extract the authorization code from query parameters
    const code = query.code as string;
    const state = query.state as string;
    const error = query.error as string;
    const errorDescription = query.error_description as string;
    
    // Handle error from Azure AD
    if (error) {
      console.error(`Auth error: ${error}`, errorDescription);
      return sendRedirect(event, `/auth/redirect?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`);
    }
    
    if (!code) {
      return sendRedirect(event, '/auth/redirect?error=no_code&error_description=Authorization+code+is+missing');
    }
    
    // Get the configuration
    const config = useRuntimeConfig();
    const { clientId, tenantId, clientSecret, redirectUri } = config.azureAd;
    
    // Store the code in a cookie or session so the frontend can use it
    // This is a simplified approach - in production you'd want to exchange
    // the code for tokens here on the server side
    setCookie(event, 'auth_code', code, {
      path: '/',
      httpOnly: false, // Set to true in production and use a server endpoint to get tokens
      maxAge: 60 * 5, // 5 minutes
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Redirect to the frontend auth redirect page
    return sendRedirect(event, '/auth/redirect');
  } catch (error) {
    console.error('OAuth redirect error:', error);
    return sendRedirect(event, `/auth/redirect?error=server_error&error_description=${encodeURIComponent('Server error processing authentication')}`);
  }
});