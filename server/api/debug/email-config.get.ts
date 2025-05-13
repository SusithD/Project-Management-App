import { defineEventHandler } from 'h3';
import nodemailer from 'nodemailer';

export default defineEventHandler(async () => {
  try {
    // Collect all email-related configuration
    const emailConfig = {
      EMAIL_HOST: process.env.EMAIL_HOST || null,
      EMAIL_PORT: process.env.EMAIL_PORT || null,
      EMAIL_USER: process.env.EMAIL_USER ? '✓ Set (redacted)' : null,
      EMAIL_PASS: process.env.EMAIL_PASS ? '✓ Set (redacted)' : null,
      EMAIL_FROM: process.env.EMAIL_FROM || null,
      PUBLIC_URL: process.env.PUBLIC_URL || null,
      NODE_ENV: process.env.NODE_ENV || 'Not set'
    };
    
    console.log('[Debug] Email configuration:', {
      ...emailConfig,
      EMAIL_USER: emailConfig.EMAIL_USER || '❌ Not set',
      EMAIL_PASS: emailConfig.EMAIL_PASS || '❌ Not set'
    });
    
    // Check if the required configuration is present
    const missingConfig = Object.entries(emailConfig)
      .filter(([key, value]) => !value && ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'].includes(key))
      .map(([key]) => key);
      
    if (missingConfig.length > 0) {
      console.error(`❌ [Debug] Missing required email configuration: ${missingConfig.join(', ')}`);
      return {
        statusCode: 500,
        body: {
          error: 'Missing email configuration',
          missingConfig,
          emailConfig: {
            ...emailConfig,
            EMAIL_USER: emailConfig.EMAIL_USER ? true : false,
            EMAIL_PASS: emailConfig.EMAIL_PASS ? true : false
          }
        }
      };
    }
    
    // Try to create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      }
    });
    
    // Verify the transporter configuration
    console.log('[Debug] Verifying email transport configuration...');
    await transporter.verify();
    console.log('✅ [Debug] Email transport verification successful');
    
    return {
      statusCode: 200,
      body: {
        success: true,
        message: 'Email configuration verified successfully',
        config: {
          ...emailConfig,
          EMAIL_USER: emailConfig.EMAIL_USER ? true : false,
          EMAIL_PASS: emailConfig.EMAIL_PASS ? true : false
        }
      }
    };
  } catch (error) {
    console.error('[Debug] Email configuration verification failed:', error);
    
    return {
      statusCode: 500,
      body: {
        error: 'Email configuration verification failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error
      }
    };
  }
});
