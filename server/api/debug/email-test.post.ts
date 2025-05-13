import { defineEventHandler, readBody } from 'h3';
import { sendProjectUpdateNotification } from '~/server/utils/email';

/**
 * Test endpoint for sending emails
 * 
 * @route POST /api/debug/email-test
 */
export default defineEventHandler(async (event) => {
  try {
    // Get test data
    const { email, name = 'Test User' } = await readBody(event);
    
    if (!email) {
      return {
        statusCode: 400,
        body: { error: 'Email address is required' }
      };
    }
    
    console.log(`[Email Test] Attempting to send test email to ${name} (${email})`);
    
    // Log environment variables related to email (with sensitive parts redacted)
    const emailConfig = {
      EMAIL_HOST: process.env.EMAIL_HOST ? '✓ Set' : '❌ Not set',
      EMAIL_PORT: process.env.EMAIL_PORT ? '✓ Set' : '❌ Not set',
      EMAIL_USER: process.env.EMAIL_USER ? '✓ Set (redacted)' : '❌ Not set',
      EMAIL_PASS: process.env.EMAIL_PASS ? '✓ Set (redacted)' : '❌ Not set',
      EMAIL_FROM: process.env.EMAIL_FROM || '❌ Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not specified'
    };
    
    console.log('[Email Test] Email configuration status:', emailConfig);
    
    // Test the email sending function
    const result = await sendProjectUpdateNotification(
      email,
      name,
      'Test Project',
      '123',
      ['name', 'description', 'status'],
      'System Test'
    );
    
    console.log('[Email Test] Email sent successfully:', result);
    
    return {
      statusCode: 200,
      body: { 
        success: true, 
        message: 'Test email sent',
        config: emailConfig,
        result
      }
    };
  } catch (error) {
    console.error('[Email Test] Failed to send email:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    
    return {
      statusCode: 500,
      body: { 
        error: 'Failed to send test email',
        message: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : typeof error
      }
    };
  }
});
