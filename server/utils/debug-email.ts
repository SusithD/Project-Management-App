import nodemailer from 'nodemailer';
import { sendProjectAssignmentNotification, sendEmail } from './email';

// Email configuration with values from .env
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER || 'iamsusithalwis@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || 'xnglzxfzwnljlthf';
const EMAIL_FROM = process.env.EMAIL_FROM || 'iamsusithalwis@gmail.com';

async function testDirectEmailSending() {
  console.log('📧 Testing direct email sending...');
  console.log('Email config:', {
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    user: EMAIL_USER ? `${EMAIL_USER.substring(0, 3)}...${EMAIL_USER.substring(EMAIL_USER.indexOf('@'))}` : 'not set',
    pass: EMAIL_PASS ? '***********' : 'not set'
  });
  
  try {
    // Create transporter object
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
          });
    
    // Verify connection configuration by sending a test email
    console.log('📧 Verifying SMTP connection by sending a test email...');
    await transporter.sendMail({
      from: `"Project Management Debug Test" <${EMAIL_FROM}>`,
      to: EMAIL_USER, // Send to yourself for testing
      subject: 'SMTP Connection Test',
      text: 'This is a test email to verify the SMTP connection.',
    });
    console.log('📧 SMTP Connection verified by sending a test email.');
    
    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Project Management Debug Test" <${EMAIL_FROM}>`,
      to: EMAIL_USER, // Send to yourself for testing
      subject: 'Email Debug Test',
      text: 'If you receive this email, the SMTP connection is working correctly.',
      html: '<p>If you receive this email, the SMTP connection is working correctly.</p>',
    });
    
    console.log('📧 Message sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email test failed:', error);
    return { success: false, error };
  }
}

async function testProjectNotification() {
  console.log('\n📧 Testing project assignment notification...');
  
  try {
    const result = await sendProjectAssignmentNotification(
      EMAIL_USER, // Your email
      'Test User',
      'Debug Test Project',
      '123456789',
      'System Administrator'
    );
    
    console.log('📧 Project notification result:', result);
    return result;
  } catch (error) {
    console.error('❌ Project notification test failed:', error);
    return { success: false, error };
  }
}

// Run both tests
export async function runEmailTests() {
  console.log('\n=============== EMAIL DEBUG TESTS ===============\n');
  const directResult = await testDirectEmailSending();
  console.log('\n-----------------------------------\n');
  const notificationResult = await testProjectNotification();
  console.log('\n=============== EMAIL TESTS COMPLETED ===============\n');
  
  return {
    directEmailTest: directResult,
    notificationTest: notificationResult
  };
}

// Allow running directly
if (require.main === module) {
  runEmailTests().then((results) => {
    console.log('All tests completed with results:', results);
  }).catch(err => {
    console.error('Test suite failed:', err);
  });
}