const { Resend } = require('resend');
const nodemailer = require('nodemailer');

/**
 * Send email using Resend API or SMTP (nodemailer) as fallback
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.from - Sender email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {Array} options.attachments - Email attachments (optional)
 * @returns {Promise<Object>} Email sending result
 */
const sendEmail = async ({ to, from, subject, html, attachments = [] }) => {
  // Try Resend first if API key is available
  if (process.env.RESEND_API) {
    try {
      const resend = new Resend(process.env.RESEND_API);
      // Prepare attachments for Resend (accepts Buffer directly)
      const resendAttachments = attachments.map((att) => {
        let content = att.content;
        // If content is base64 string, convert to Buffer (Resend accepts Buffer)
        if (typeof content === 'string') {
          content = Buffer.from(content, 'base64');
        }
        // If already Buffer, use as is
        return {
          filename: att.filename,
          content: content,
        };
      });

      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        attachments: resendAttachments,
      });

      if (error) {
        console.log('⚠️ Resend API error, trying SMTP fallback:', error.message);
        throw error;
      }

      console.log('✅ Email sent via Resend API');
      return { success: true, data, method: 'resend' };
    } catch (error) {
      console.log('⚠️ Resend failed, trying SMTP:', error.message);
      // Fall through to SMTP
    }
  }

  // Fallback to SMTP (nodemailer)
  try {
    // SMTP configuration from environment variables
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
      },
    };

    // If no SMTP credentials, use a test account (for development)
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.log('⚠️ No SMTP credentials found, using test account');
      // Create a test transporter (won't actually send emails)
      const testAccount = await nodemailer.createTestAccount();
      smtpConfig.auth = {
        user: testAccount.user,
        pass: testAccount.pass,
      };
      smtpConfig.host = 'smtp.ethereal.email';
      smtpConfig.port = 587;
      smtpConfig.secure = false;
    }

    const transporter = nodemailer.createTransport(smtpConfig);

    // Convert attachments format for nodemailer
    const nodemailerAttachments = attachments.map((att) => {
      let content = att.content;
      // If content is Buffer, convert to base64 string
      if (Buffer.isBuffer(content)) {
        content = content.toString('base64');
      }
      // If content is already base64 string, use as is
      return {
        filename: att.filename,
        content: content,
        encoding: 'base64',
      };
    });

    const mailOptions = {
      from: from || smtpConfig.auth.user,
      to,
      subject,
      html,
      attachments: nodemailerAttachments.length > 0 ? nodemailerAttachments : undefined,
    };

    const info = await transporter.sendMail(mailOptions);

    // If using test account, log the preview URL
    if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_USER) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('📧 Test email preview URL:', previewUrl);
      }
    }

    console.log('✅ Email sent via SMTP');
    return { success: true, data: info, method: 'smtp' };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = { sendEmail };
