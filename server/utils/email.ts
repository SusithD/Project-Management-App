/**
 * Email Service for Project Management App
 * 
 * This module provides functionality for sending emails
 * using nodemailer for various app notifications.
 */
import nodemailer, { Transporter } from 'nodemailer';
import { useRuntimeConfig } from '#imports';

// Get email configuration from runtime config
const config = useRuntimeConfig();

// Email configuration with fallbacks
const EMAIL_HOST = config.email?.host || process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(config.email?.port || process.env.EMAIL_PORT || '587');
const EMAIL_USER = config.email?.user || process.env.EMAIL_USER || '';
const EMAIL_PASS = config.email?.password || process.env.EMAIL_PASS || '';
const EMAIL_FROM = config.email?.from || process.env.EMAIL_FROM || 'noreply@projectmanagement.com';
const APP_NAME = 'The qexle Project Management';

// Maximum number of retry attempts for sending emails
const MAX_RETRY_ATTEMPTS = 3;
// Delay between retry attempts (in milliseconds)
const RETRY_DELAY = 1000;

console.log('📧 [Email Service] Initializing with config:',  { 
  host: EMAIL_HOST, 
  port: EMAIL_PORT, 
  secure: EMAIL_PORT === 465, 
  user: EMAIL_USER ? `${EMAIL_USER.substring(0, 3)}...${EMAIL_USER.substring(EMAIL_USER.indexOf('@') || 0)}` : 'not set',
  from: EMAIL_FROM 
});

// Create a function to get a fresh transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    // Connection timeout settings to prevent hanging issues
    connectionTimeout: 30000, // 30 seconds connection timeout
    socketTimeout: 60000,     // 60 seconds socket timeout
    tls: {
      rejectUnauthorized: false, // For self-signed certificates
    },
  });
}

// Initialize the transporter
let transporter = createTransporter();

// Verify transporter connection on initialization
if (EMAIL_USER && EMAIL_PASS) {
  (async () => {
    try {
      // Use the proper method to verify connection
      await transporter.verify();
      console.log('📧 [Email Service] SMTP connection verified successfully');
    } catch (error) {
      console.error('❌ [Email Service] SMTP connection verification failed:', error);
      console.log('📧 [Email Service] Will attempt to reconnect when sending emails');
    }
  })();
} else {
  console.warn('⚠️ [Email Service] Email credentials not provided - email sending will not work');
}

/**
 * Send an email notification with retry capability
 * 
 * @param to Email address of the recipient
 * @param subject Email subject
 * @param html HTML content of the email
 * @param text Plain text version of the email
 * @param retryAttempt Current retry attempt number
 * @returns Promise resolving to send result
 */
export async function sendEmail(
  to: string, 
  subject: string, 
  html: string, 
  text?: string, 
  retryAttempt: number = 0
) {
  console.log(`📧 [Email Service] Sending email to: ${to}, subject: ${subject}, attempt: ${retryAttempt + 1}`);
  
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('❌ [Email Service] Cannot send email: Missing credentials');
    return { success: false, error: 'Missing email credentials' };
  }
  
  try {
    // Get a fresh transporter if this is a retry
    if (retryAttempt > 0) {
      console.log(`📧 [Email Service] Creating fresh transporter for retry attempt ${retryAttempt + 1}`);
      transporter = createTransporter();
    }
    
    const info = await transporter.sendMail({
      from: `"${APP_NAME}" <${EMAIL_FROM}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML if text not provided
      html,
    });

    console.log(`📧 [Email Service] Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ [Email Service] Email sending failed (attempt ${retryAttempt + 1}):`, error.message || error);
    
    // Check if we should retry
    if (retryAttempt < MAX_RETRY_ATTEMPTS && 
        (error.code === 'ECONNRESET' || 
         error.code === 'ETIMEDOUT' || 
         error.code === 'ESOCKET' ||
         error.code === 'ECONNREFUSED')) {
      
      console.log(`📧 [Email Service] Connection error detected. Will retry in ${RETRY_DELAY}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
      // Attempt to retry
      return sendEmail(to, subject, html, text, retryAttempt + 1);
    }
    
    return { 
      success: false, 
      error: error.message || 'Email sending failed',
      code: error.code
    };
  }
}

/**
 * Send a notification when a user is assigned to a project
 * 
 * @param userEmail Email address of the assigned user
 * @param userName Name of the assigned user
 * @param projectName Name of the project
 * @param projectId ID of the project (can be any string format)
 * @param assignedBy Name of the user who assigned the project
 */
export async function sendProjectAssignmentNotification(
  userEmail: string,
  userName: string,
  projectName: string,
  projectId: string,
  assignedBy: string
) {
  console.log(`📧 [Email Service] Sending project assignment notification to ${userEmail} for project '${projectName}'`);
  
  // Ensure projectId is treated as a string without any conversion
  const safeProjectId = String(projectId);
  
  const subject = `New Project Assignment: ${projectName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>Project Assignment: ${projectName}</title>
      <style>
        @media (prefers-color-scheme: dark) {
          .email-body { background-color: #1a1a1a !important; }
          .email-container { background-color: #2d2d2d !important; border-color: #444444 !important; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4) !important; }
          .header { background: linear-gradient(135deg, #004080 0%, #0074cc 100%) !important; }
          .body-content { background-color: #2d2d2d !important; color: #e1e1e1 !important; }
          .greeting, .project-title { color: #ffffff !important; }
          .text-content { color: #cccccc !important; }
          .project-card { background: linear-gradient(to right, #252525, #2a2a2a) !important; border-color: #444444 !important; }
          .data-label { color: #a0aec0 !important; }
          .data-value { color: #e1e1e1 !important; }
          .help-box { background-color: #252525 !important; border-color: #444444 !important; }
          .footer { background: linear-gradient(to right, #252525, #2a2a2a) !important; border-color: #444444 !important; }
          .footer-text { color: #a0aec0 !important; }
        }

        /* Fix for Outlook dark mode */
        [data-ogsc] .email-body { background-color: #1a1a1a !important; }
        [data-ogsc] .email-container { background-color: #2d2d2d !important; border-color: #444444 !important; }
        [data-ogsc] .header { background: linear-gradient(135deg, #004080 0%, #0074cc 100%) !important; }
        [data-ogsc] .body-content { background-color: #2d2d2d !important; color: #e1e1e1 !important; }
        [data-ogsc] .greeting, [data-ogsc] .project-title { color: #ffffff !important; }
        [data-ogsc] .text-content { color: #cccccc !important; }
        [data-ogsc] .project-card { background: linear-gradient(to right, #252525, #2a2a2a) !important; border-color: #444444 !important; }
        [data-ogsc] .data-label { color: #a0aec0 !important; }
        [data-ogsc] .data-value { color: #e1e1e1 !important; }
        [data-ogsc] .help-box { background-color: #252525 !important; border-color: #444444 !important; }
        [data-ogsc] .footer { background: linear-gradient(to right, #252525, #2a2a2a) !important; border-color: #444444 !important; }
        [data-ogsc] .footer-text { color: #a0aec0 !important; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background-color: #f5f7fa; color: #333333;" class="email-body">
      <div class="email-container" style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
        <!-- Header with Blue Theme -->
        <div class="header" style="position: relative; background: linear-gradient(135deg, #0062cc 0%, #0096ff 100%); padding: 30px 25px; color: white; text-align: center;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYyMCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1kYXNoYXJyYXk9IjMgMiIvPjwvc3ZnPg=='); opacity: 0.3;"></div>
          <svg style="width: 50px; height: 50px; margin-bottom: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${APP_NAME}</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Project Assignment Notification</p>
          <div style="position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); background: #ffffff; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
            <svg style="width: 16px; height: 16px; color: #0062cc;" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        
        <!-- Body Content -->
        <div class="body-content" style="padding: 35px 30px; background-color: #ffffff;">
          <h2 class="greeting" style="color: #1a365d; font-size: 20px; font-weight: 600; margin-top: 0;">Hello ${userName},</h2>
          
          <p class="text-content" style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">You have been assigned to a new project. Here are the details:</p>
          
          <!-- Modern Project Card -->
          <div class="project-card" style="background: linear-gradient(to right, #f8fafc, #f1f5f9); border-radius: 12px; padding: 25px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06); position: relative; overflow: hidden; border: 1px solid #e5e7eb;">
            <!-- Decorative elements -->
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: linear-gradient(to right, #0062cc, #00a5ff);"></div>
            <div style="position: absolute; top: 5px; right: 10px; opacity: 0.05;">
              <svg style="width: 80px; height: 80px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2v-4H8v-2h4V7h2v4h4v2h-4v4z"/>
              </svg>
            </div>
            
            <h3 class="project-title" style="margin-top: 5px; margin-bottom: 20px; color: #0062cc; font-size: 22px; font-weight: 700;">${projectName}</h3>
            
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; font-size: 15px;">
              <div class="data-label" style="color: #64748b; font-weight: 500; display: flex; align-items: center;">
                <svg style="width: 18px; height: 18px; margin-right: 8px; color: #0062cc;" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                Project ID:
              </div>
              <div class="data-value" style="color: #334155; font-weight: 500;">#${safeProjectId}</div>
              
              <div class="data-label" style="color: #64748b; font-weight: 500; display: flex; align-items: center;">
                <svg style="width: 18px; height: 18px; margin-right: 8px; color: #0062cc;" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                Assigned By:
              </div>
              <div class="data-value" style="color: #334155; font-weight: 500;">${assignedBy}</div>
              
              <div class="data-label" style="color: #64748b; font-weight: 500; display: flex; align-items: center;">
                <svg style="width: 18px; height: 18px; margin-right: 8px; color: #0062cc;" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
                Date Assigned:
              </div>
              <div class="data-value" style="color: #334155;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              
              <div class="data-label" style="color: #64748b; font-weight: 500; display: flex; align-items: center;">
                <svg style="width: 18px; height: 18px; margin-right: 8px; color: #0062cc;" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 001.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
                Status:
              </div>
              <div>
                <span style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 99px; display: inline-flex; align-items: center; box-shadow: 0 2px 5px rgba(16, 185, 129, 0.25);">
                  <svg style="width: 12px; height: 12px; margin-right: 4px;" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  New Assignment
                </span>
              </div>
            </div>
          </div>
          
          <p class="text-content" style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">Please log in to the Project Management System to view all the details about this project including deadlines, priorities, and any attached files.</p>
          
          <!-- Modern Action Button -->
          <div style="text-align: center; margin: 35px 0 25px;">
            <a href="${config.public.appUrl || 'http://localhost:3000'}/projects/${safeProjectId}" 
               style="background: linear-gradient(to right, #0062cc, #0096ff); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; transition: all 0.2s; box-shadow: 0 4px 10px rgba(0, 98, 204, 0.25);">
              <span style="display: inline-flex; align-items: center; justify-content: center;">
                <span>View Project Details</span>
                <svg style="width: 18px; height: 18px; margin-left: 8px;" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </span>
            </a>
          </div>
          
          <div class="help-box" style="margin-top: 30px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
            <h4 style="margin-top: 0; margin-bottom: 12px; color: #0062cc; font-size: 16px; font-weight: 600;">Need assistance?</h4>
            <p class="text-content" style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 0;">If you have any questions or need assistance with this project, please contact your project manager or team lead.</p>
          </div>
        </div>
        
        <!-- Modern Footer -->
        <div class="footer" style="background: linear-gradient(to right, #f1f5f9, #f8fafc); padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <div style="max-width: 400px; margin: 0 auto;">
            <div style="display: flex; justify-content: center; margin-bottom: 15px;">
              <!-- Social links (you can modify these as needed) -->
              <a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background-color: #0062cc; margin: 0 5px;">
                <svg style="width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
                </svg>
              </a>
              <a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background-color: #0062cc; margin: 0 5px;">
                <svg style="width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.959-2.173-1.559-3.591-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 14-7.503 14-14 0-.21 0-.42-.015-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z" />
                </svg>
              </a>
              <a href="#" style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background-color: #0062cc; margin: 0 5px;">
                <svg style="width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm5.209 17.209a1.493 1.493 0 01-2.105 0L12 14.105l-3.104 3.104a1.493 1.493 0 01-2.104-2.105L9.896 12 6.791 8.896a1.493 1.493 0 012.104-2.105L12 9.894l3.104-3.103a1.493 1.493 0 012.105 2.104L14.105 12l3.104 3.104a1.493 1.493 0 010 2.105z" />
                </svg>
              </a>
            </div>
            
            <p class="footer-text" style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            <p class="footer-text" style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(userEmail, subject, html);
}

/**
 * Send a notification when blockers are added or updated for a project
 * 
 * @param userEmail Email address of the responsible person
 * @param userName Name of the responsible person
 * @param projectName Name of the project
 * @param projectId ID of the project (can be any string format)
 * @param blockerDetails The details of the blocker
 * @param updatedBy Name of the user who added/updated the blocker
 */
export async function sendBlockerNotification(
  userEmail: string,
  userName: string,
  projectName: string,
  projectId: string,
  blockerDetails: string,
  updatedBy: string
) {
  console.log(`📧 [Email Service] Sending blocker notification to ${userEmail} for project '${projectName}'`);
  
  // Ensure projectId is treated as a string without any conversion
  const safeProjectId = String(projectId);
  
  const subject = `Blocker Update: ${projectName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>Blocker Update: ${projectName}</title>
      <style>
        @media (prefers-color-scheme: dark) {
          .email-body { background-color: #1a1a1a !important; }
          .email-container { background-color: #2d2d2d !important; border-color: #444444 !important; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4) !important; }
          .header { background: linear-gradient(135deg, #004080 0%, #0074cc 100%) !important; }
          .body-content { background-color: #2d2d2d !important; color: #e1e1e1 !important; }
          .greeting, .project-title { color: #ffffff !important; }
          .text-content { color: #cccccc !important; }
          .project-card { background: linear-gradient(to right, #252525, #2a2a2a) !important; border-color: #444444 !important; }
          .data-label { color: #a0aec0 !important; }
          .data-value { color: #e1e1e1 !important; }
          .help-box { background-color: #252525 !important; border-color: #444444 !important; }
          .footer { background: linear-gradient(to right, #252525, #2a2a2a) !important; border-color: #444444 !important; }
          .footer-text { color: #a0aec0 !important; }
        }

        /* Fix for Outlook dark mode */
        [data-ogsc] .email-body { background-color: #1a1a1a !important; }
        [data-ogsc] .email-container { background-color: #2d2d2d !important; border-color: #444444 !important; }
        [data-ogsc] .header { background: linear-gradient(135deg, #004080 0%, #0074cc 100%) !important; }
        [data-ogsc] .body-content { background-color: #2d2d2d !important; color: #e1e1e1 !important; }
        [data-ogsc] .greeting, [data-ogsc] .project-title { color: #ffffff !important; }
        [data-ogsc] .text-content { color: #cccccc !important; }
        [data-ogsc] .project-card { background: linear-gradient(to right, #252525, #2a2a2a) !important; border-color: #444444 !important; }
        [data-ogsc] .data-label { color: #a0aec0 !important; }
        [data-ogsc] .data-value { color: #e1e1e1 !important; }
        [data-ogsc] .help-box { background-color: #252525 !important; border-color: #444444 !important; }
        [data-ogsc] .footer { background: linear-gradient(to right, #252525, #2a2a2a) !important; border-color: #444444 !important; }
        [data-ogsc] .footer-text { color: #a0aec0 !important; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background-color: #f5f7fa; color: #333333;" class="email-body">
      <div class="email-container" style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
        <!-- Header with Blue Theme -->
        <div class="header" style="position: relative; background: linear-gradient(135deg, #0062cc 0%, #0096ff 100%); padding: 30px 25px; color: white; text-align: center;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYyMCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1kYXNoYXJyYXk9IjMgMiIvPjwvc3ZnPg=='); opacity: 0.3;"></div>
          <svg style="width: 50px; height: 50px; margin-bottom: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${APP_NAME}</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Blocker Update Notification</p>
          <div style="position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); background: #ffffff; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
            <svg style="width: 16px; height: 16px; color: #0062cc;" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
          </div>
        </div>
        
        <!-- Body Content -->
        <div class="body-content" style="padding: 35px 30px; background-color: #ffffff;">
          <h2 class="greeting" style="color: #1a365d; font-size: 20px; font-weight: 600; margin-top: 0;">Hello ${userName},</h2>
          
          <p class="text-content" style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">There is an update regarding a blocker on your project. Here are the details:</p>
          
          <!-- Modern Project Card -->
          <div class="project-card" style="background: linear-gradient(to right, #f8fafc, #f1f5f9); border-radius: 12px; padding: 25px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06); position: relative; overflow: hidden; border: 1px solid #e5e7eb;">
            <!-- Decorative elements -->
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: linear-gradient(to right, #0062cc, #00a5ff);"></div>
            
            <h3 class="project-title" style="margin-top: 5px; margin-bottom: 20px; color: #0062cc; font-size: 22px; font-weight: 700;">${projectName}</h3>
            
            <div style="display: grid; grid-template-columns: 140px 1fr; gap: 12px; font-size: 15px;">
              <div class="data-label" style="color: #64748b; font-weight: 500; display: flex; align-items: center;">
                <svg style="width: 18px; height: 18px; margin-right: 8px; color: #0062cc;" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                Project ID:
              </div>
              <div class="data-value" style="color: #334155; font-weight: 500;">#${safeProjectId}</div>
              
              <div class="data-label" style="color: #64748b; font-weight: 500; display: flex; align-items: center;">
                <svg style="width: 18px; height: 18px; margin-right: 8px; color: #0062cc;" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                Updated By:
              </div>
              <div class="data-value" style="color: #334155; font-weight: 500;">${updatedBy}</div>
              
              <div class="data-label" style="color: #64748b; font-weight: 500; display: flex; align-items: center;">
                <svg style="width: 18px; height: 18px; margin-right: 8px; color: #0062cc;" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                </svg>
                Date Updated:
              </div>
              <div class="data-value" style="color: #334155;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
          
          <!-- Blocker Details Box -->
          <div class="update-box" style="background-color: #FEF3F2; border: 1px solid #FECACA; border-left: 6px solid #E53E3E; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h4 style="margin-top: 0; margin-bottom: 12px; color: #E53E3E; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
              <svg style="width: 20px; height: 20px; margin-right: 8px;" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a1 1 0 011 1v1a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
              </svg>
              Blocker Details
            </h4>
            <div style="background-color: white; border-radius: 6px; padding: 15px; color: #4a5568; font-size: 15px; line-height: 1.6;">
              <p style="margin-top: 0;">The following blocker has been added/updated:</p>
              <p style="margin: 8px 0; font-weight: 500;">${blockerDetails}</p>
            </div>
          </div>
          
          <p class="text-content" style="color: #4a5568; line-height: 1.6; font-size: 16px; margin-bottom: 25px;">
            Login to the project management system to view all the recent changes and updates.
          </p>
          
          <!-- Modern Action Button -->
          <div style="text-align: center; margin: 35px 0 25px;">
            <a href="${config.public.appUrl || 'http://localhost:3000'}/projects/${safeProjectId}" 
               style="background: linear-gradient(to right, #0062cc, #0096ff); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; transition: all 0.2s; box-shadow: 0 4px 10px rgba(0, 98, 204, 0.25);">
              <span style="display: inline-flex; align-items: center; justify-content: center;">
                <span>View Project Details</span>
                <svg style="width: 18px; height: 18px; margin-left: 8px;" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </span>
            </a>
          </div>
          
          <div class="help-box" style="margin-top: 30px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
            <h4 style="margin-top: 0; margin-bottom: 12px; color: #0062cc; font-size: 16px; font-weight: 600;">Need assistance?</h4>
            <p class="text-content" style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 0;">If you have any questions about this blocker update, please contact your project manager or team lead.</p>
          </div>
        </div>
        
        <!-- Modern Footer -->
        <div class="footer" style="background: linear-gradient(to right, #f1f5f9, #f8fafc); padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p class="footer-text" style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          <p class="footer-text" style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(userEmail, subject, html);
}

/**
 * Send notification about project updates
 */
export async function sendProjectUpdateNotification(
  recipientEmail: string,
  recipientName: string,
  projectName: string,
  projectId: string,
  updatedFields: string[],
  updatedBy: string
) {
  console.log(`📧 [Email Service] Sending project update notification to ${recipientEmail} for project '${projectName}'`);
  
  try {
    // Create a formatted list of updated fields
    const fieldsList = updatedFields.map(field => {
      // Convert camelCase to Title Case (e.g., "startDate" becomes "Start Date")
      const formatted = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      return `• ${formatted}`;
    }).join('\n');
    
    const subject = `Project Updated: ${projectName}`;
    const text = `
Hello ${recipientName},

The project "${projectName}" has been updated by ${updatedBy}.

The following fields were updated:
${fieldsList}

You can view the project details here: ${process.env.PUBLIC_URL}/projects/${projectId}

Regards,
The Project Management Team
    `.trim();
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4a6fdc; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }
    .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
    .btn { display: inline-block; padding: 10px 20px; background-color: #4a6fdc; color: white; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Project Update Notification</h2>
    </div>
    <div class="content">
      <p>Hello ${recipientName},</p>
      <p>The project <strong>"${projectName}"</strong> has been updated by <strong>${updatedBy}</strong>.</p>
      <p>The following fields were updated:</p>
      <ul>
        ${updatedFields.map(field => {
          const formatted = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          return `<li>${formatted}</li>`;
        }).join('')}
      </ul>
      <p>
        <a href="${process.env.PUBLIC_URL || 'http://localhost:3000'}/projects/${projectId}" class="btn">View Project</a>
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
    
    console.log(`📧 [Email Service] Sending email to: ${recipientEmail}, subject: ${subject}, attempt: 1`);
    
    // Send the email
    const result = await sendEmail(recipientEmail, subject, text, html);
    
    console.log(`📧 [Email Service] Email sent successfully:`, result.messageId);
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error(`❌ [Email Service] Failed to send project update notification:`, error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    throw error;
  }
}