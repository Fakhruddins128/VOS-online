const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    // Check if email configuration exists
    this.isConfigured = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

    if (this.isConfigured) {
      const transportConfig = {
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };

      if (process.env.EMAIL_SERVICE) {
        // Named service (gmail, outlook, etc.) - nodemailer handles host/port/secure
        transportConfig.service = process.env.EMAIL_SERVICE;
      } else {
        // Generic SMTP
        transportConfig.host = process.env.EMAIL_HOST;
        transportConfig.port = Number(process.env.EMAIL_PORT) || 587;
        transportConfig.secure = process.env.EMAIL_SECURE === 'true';
      }

      this.transporter = nodemailer.createTransport(transportConfig);
    } else {
      console.warn('[emailService] Not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env to send real emails.');
    }
  }

  async sendPasswordResetEmail(to, newPassword) {
    if (!this.isConfigured) {
      console.warn(`[emailService][DEV] Password reset for ${to}: new password = ${newPassword} (email NOT sent - SMTP not configured)`);
      return {
        success: true,
        dev: true,
        message: 'SMTP not configured. Use the generated password below to sign in (development only).',
      };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: 'Password Reset - VOS Online Vendor Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>Your password has been reset successfully. Please use the following temporary password to login:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0;">
            ${newPassword}
          </div>
          <p>We recommend changing this password immediately after logging in.</p>
          <p>Best regards,<br>VOS Online Vendor Portal Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true, dev: false };
    } catch (error) {
      console.error('[emailService] Email send error:', error.message);
      return { success: false, error: 'Failed to send email.' };
    }
  }
}

module.exports = new EmailService();
