const nodemailer = require('nodemailer');
const { Settings } = require('../models');

// Email transporter cache
let transporter = null;

/**
 * Get email configuration from settings
 */
const getEmailConfig = async () => {
  try {
    const config = {};
    const keys = [
      'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password',
      'smtp_secure', 'email_from', 'email_to', 'email_enabled'
    ];

    const settings = await Settings.findAll({
      where: { setting_key: keys }
    });

    settings.forEach(s => {
      config[s.setting_key] = s.setting_value;
    });

    return {
      host: config.smtp_host || 'smtp.gmail.com',
      port: parseInt(config.smtp_port) || 587,
      user: config.smtp_user,
      password: config.smtp_password,
      secure: config.smtp_secure === 'true',
      from: config.email_from || config.smtp_user,
      to: config.email_to || config.smtp_user,
      enabled: config.email_enabled === 'true'
    };
  } catch (error) {
    console.error('Failed to get email config:', error);
    return { enabled: false };
  }
};

/**
 * Get or create email transporter
 */
const getTransporter = async () => {
  if (!transporter) {
    const config = await getEmailConfig();
    
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password
      }
    });

    // Verify transporter
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified');
    } catch (error) {
      console.error('❌ Email transporter verification failed:', error);
      transporter = null;
    }
  }

  return transporter;
};

/**
 * Send backup notification email
 */
exports.sendBackupNotification = async ({ type, filename, size, error, timestamp }) => {
  try {
    const config = await getEmailConfig();
    
    if (!config.enabled) {
      console.log('📧 Email notifications disabled, skipping');
      return { success: false, message: 'Email notifications disabled' };
    }

    if (!config.to) {
      console.log('⚠️  No email recipient configured');
      return { success: false, message: 'No email recipient configured' };
    }

    const mailer = await getTransporter();
    if (!mailer) {
      console.log('❌ Email transporter not available');
      return { success: false, message: 'Email transporter not configured' };
    }

    const subject = type === 'success' 
      ? `✅ Backup Successful - ${new Date().toLocaleDateString()}`
      : `❌ Backup Failed - ${new Date().toLocaleDateString()}`;

    const html = type === 'success' ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">✅ Backup Successful</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">Your scheduled backup has been completed successfully.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;"><strong>Filename:</strong></td>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;">${filename}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;"><strong>Size:</strong></td>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;">${formatBytes(size)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;"><strong>Timestamp:</strong></td>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;">${new Date(timestamp).toLocaleString()}</td>
            </tr>
          </table>
          <p style="color: #6b7280; font-size: 14px;">This is an automated message from POS System.</p>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">❌ Backup Failed</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <p style="font-size: 16px; color: #374151;">The scheduled backup has failed. Please check the system logs.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;"><strong>Error:</strong></td>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb; color: #ef4444;">${error}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;"><strong>Timestamp:</strong></td>
              <td style="padding: 10px; background: white; border: 1px solid #e5e7eb;">${new Date(timestamp).toLocaleString()}</td>
            </tr>
          </table>
          <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;"><strong>Action Required:</strong> Please review the error and take necessary steps to resolve the issue.</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: config.from,
      to: config.to,
      subject,
      html
    };

    const result = await mailer.sendMail(mailOptions);
    console.log('📧 Backup notification email sent:', result.messageId);

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Failed to send backup notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test email configuration
 */
exports.testEmailConfig = async () => {
  try {
    const config = await getEmailConfig();
    
    if (!config.enabled) {
      return { success: false, message: 'Email notifications are disabled' };
    }

    const mailer = await getTransporter();
    if (!mailer) {
      return { success: false, message: 'Email transporter not configured properly' };
    }

    // Send test email
    const result = await mailer.sendMail({
      from: config.from,
      to: config.to,
      subject: '🧪 Test Email - POS System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #3b82f6;">Test Email Successful</h2>
          <p>Your email configuration is working correctly!</p>
          <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    return { 
      success: true, 
      message: 'Test email sent successfully',
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Email test failed:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
