const fs = require('fs');
const mongoose = require('mongoose');
const { loadSettings } = require('@/middlewares/settings');
const { SendQuote } = require('@/emailTemplate/SendEmailTemplate');
const custom = require('@/controllers/pdfController');
const { sendEmail } = require('@/utils/emailService');
const path = require('path');

const mail = async (req, res) => {
  try {
    const Model = mongoose.model('Quote');
    const { id, email } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Quote ID is required',
      });
    }

    const quote = await Model.findOne({ _id: id, removed: false })
      .populate('client')
      .exec();

    if (!quote) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Quote not found',
      });
    }

    const clientEmail = email || quote.client?.email;
    if (!clientEmail) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Client email is required',
      });
    }

    const settings = await loadSettings();
    const idurar_app_email = settings['idurar_app_email'] || process.env.SMTP_USER || 'noreply@example.com';

    // Generate PDF if it doesn't exist
    const fileId = 'quote-' + quote._id + '.pdf';
    const folderPath = 'quote';
    const targetLocation = path.join(__dirname, '../../../public/download', folderPath, fileId);

    // Ensure directory exists
    const dir = path.dirname(targetLocation);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Generate PDF
    await new Promise((resolve, reject) => {
      custom.generatePdf(
        'quote',
        { filename: folderPath, format: 'A4', targetLocation },
        quote,
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });

    // Read PDF file
    const pdfBuffer = fs.readFileSync(targetLocation);

    // Send email with PDF attachment
    const clientName = quote.client?.name || quote.client?.company || 'Customer';
    const subject = `Quote #${quote.number} - ${settings['idurar_app_name'] || 'Your Company'}`;

    const result = await sendEmail({
      to: clientEmail,
      from: idurar_app_email,
      subject: subject,
      html: SendQuote({
        title: `Quote #${quote.number}`,
        name: clientName,
        time: new Date(),
      }),
      attachments: [
        {
          filename: fileId,
          content: pdfBuffer, // Pass buffer directly, emailService will handle conversion
        },
      ],
    });

    return res.status(200).json({
      success: true,
      result: result.data,
      message: `Quote sent successfully to ${clientEmail} via ${result.method}`,
    });
  } catch (error) {
    console.error('❌ Email sending error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Failed to send email. Please check email configuration.',
      error: error.message,
    });
  }
};

module.exports = mail;
