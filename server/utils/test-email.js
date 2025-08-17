/**
 * Email Testing Script
 * 
 * This script tests your email configuration and tries to send a test email
 * to diagnose any issues with the email notification system.
 */
import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file if it exists
try {
  const envPath = path.resolve(process.cwd(), '.env');
  dotenv.config({ path: envPath });
  console.log('📋 Loaded environment from .env file');
} catch (e) {
  console.log('📋 No .env file found or dotenv not installed, using process.env');
}

// Email configuration with fallbacks
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@projectmanagement.com';
const APP_NAME = 'The qexle Project Management';

// Test recipient email (change this to your email)
const TEST_EMAIL = process.env.TEST_EMAIL || process.env.EMAIL_USER;

console.log('\n=== Email Configuration Test ===\n');
console.log('📧 Current Email Configuration:');
console.log(`- Host: ${EMAIL_HOST}`);
console.log(`- Port: ${EMAIL_PORT}`);
console.log(`- User: ${EMAIL_USER ? `${EMAIL_USER.substring(0, 3)}...${EMAIL_USER.substring(EMAIL_USER.indexOf('@') || 0)}` : 'not set'}`);
console.log(`- Password: ${EMAIL_PASS ? '********' : 'not set'}`);
console.log(`- From: ${EMAIL_FROM}`);
console.log(`- Test recipient: ${TEST_EMAIL || 'not set'}`);

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
    debug: true, // Enable debug output
  });
}

// Check if required credentials are present
if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('\n❌ ERROR: Email credentials missing');
  console.log('Make sure EMAIL_USER and EMAIL_PASS are set in your environment variables');
  console.log('For Gmail: Use an app password instead of your regular password');
  console.log('See: https://support.google.com/accounts/answer/185833');
  process.exit(1);
}

if (!TEST_EMAIL) {
  console.error('\n❌ ERROR: No test recipient email provided');
  console.log('Set TEST_EMAIL in your environment variables or use EMAIL_USER as fallback');
  process.exit(1);
}

// Initialize the transporter
let transporter = createTransporter();

async function runTests() {
  console.log('\n1. Testing SMTP Connection...');
  
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
  } catch (error) {
    console.error('❌ SMTP connection failed:');
    console.error(`   ${error.message}`);
    if (error.code === 'EAUTH') {
      console.log('\nTroubleshooting authentication issues:');
      console.log('- For Gmail: Make sure you\'re using an App Password instead of your regular password');
      console.log('- Check if 2FA is enabled on your account, which requires App Passwords');
      console.log('- Verify that your email service provider allows SMTP access');
    }
    if (error.code === 'ESOCKET') {
      console.log('\nTroubleshooting connection issues:');
      console.log('- Check if your network blocks SMTP ports');
      console.log('- Verify the EMAIL_HOST and EMAIL_PORT settings');
      console.log('- Try using secure: true with port 465, or secure: false with port 587');
    }
    return false;
  }

  console.log('\n2. Sending test email...');
  
  try {
    const info = await transporter.sendMail({
      from: `"${APP_NAME}" <${EMAIL_FROM}>`,
      to: TEST_EMAIL,
      subject: 'Email Test - Project Management System',
      text: 'If you receive this email, your email configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #0062cc;">Email Configuration Test</h2>
          <p>If you're seeing this message, your email configuration is working correctly! 🎉</p>
          <p>This is a test email from your Project Management System.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`- Message ID: ${info.messageId}`);
    console.log(`- Sent to: ${TEST_EMAIL}`);
    console.log('\nCheck your inbox to confirm receipt of the test email.');
    console.log('Note: It may take a few minutes to arrive or might be in your spam folder.');
    
    return true;
  } catch (error) {
    console.error('❌ Error sending test email:');
    console.error(`   ${error.message}`);
    console.error('\nDetailed error:');
    console.error(error);
    return false;
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Unexpected error during testing:');
  console.error(error);
  process.exit(1);
});