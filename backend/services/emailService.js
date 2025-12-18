const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    // Check if email configuration exists
    this.isConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;
    
    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail', // Default to gmail if not specified
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      console.warn('Email service is not configured. Please set EMAIL_USER and EMAIL_PASS in .env');
    }
  }

  async sendPasswordResetEmail(to, newPassword) {
    if (!this.isConfigured) {
      console.log(`[DEV] Password reset for ${to}: New password is ${newPassword}`);
      return { success: true, dev: true, message: 'Email not configured. New password logged to server.' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: to,
      subject: 'Password Reset - Vendor Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>Your password has been reset successfully. Please use the following temporary password to login:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0;">
            ${newPassword}
          </div>
          <p>We recommend changing this password immediately after logging in.</p>
          <p>Best regards,<br>Vendor Portal Team</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: 'Failed to send email.' };
    }
  }
}

module.exports = new EmailService();
