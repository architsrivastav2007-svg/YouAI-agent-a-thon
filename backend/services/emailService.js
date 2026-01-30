/**
 * PHASE 2 - Email Service
 * 
 * Isolated email service using Nodemailer
 * Sends SOS, location request, and auto-SOS emails
 */

const nodemailer = require('nodemailer');

// Create transporter from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Send email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Email body (can be HTML)
 * @returns {Promise<Object>} - Send result
 */
async function sendEmail(to, subject, message) {
  console.log('[EMAIL-SERVICE] Attempting to send email...');
  console.log('[EMAIL-SERVICE] To:', to);
  console.log('[EMAIL-SERVICE] Subject:', subject);
  console.log('[EMAIL-SERVICE] SMTP User:', process.env.SMTP_USER);

  try {
    const info = await transporter.sendMail({
      from: `"SOS Alert System" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: message
    });

    console.log('[EMAIL-SERVICE] ✅ Email sent successfully');
    console.log('[EMAIL-SERVICE] Message ID:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('[EMAIL-SERVICE] ❌ Failed to send email');
    console.error('[EMAIL-SERVICE] Error:', error.message);
    
    // DO NOT swallow errors - throw them
    throw error;
  }
}

/**
 * Verify email configuration
 */
async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log('[EMAIL-SERVICE] ✅ SMTP configuration is valid');
    return true;
  } catch (error) {
    console.error('[EMAIL-SERVICE] ❌ SMTP configuration error:', error.message);
    return false;
  }
}

module.exports = {
  sendEmail,
  verifyEmailConfig
};
