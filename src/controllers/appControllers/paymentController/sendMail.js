const fs = require('fs');
const mongoose = require('mongoose');
const { loadSettings } = require('@/middlewares/settings');
const { SendPaymentReceipt } = require('@/emailTemplate/SendEmailTemplate');
const custom = require('@/controllers/pdfController');
const { sendEmail } = require('@/utils/emailService');
const path = require('path');

const mail = async (req, res) => {
  try {
    const Model = mongoose.model('Payment');
    const { id, email } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Payment ID is required',
      });
    }

    const payment = await Model.findOne({ _id: id, removed: false })
      .populate('client')
      .exec();

    if (!payment) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Payment not found',
      });
    }

    const clientEmail = email || payment.client?.email;
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
    const fileId = 'payment-' + payment._id + '.pdf';
    const folderPath = 'payment';
    const targetLocation = path.join(__dirname, '../../../public/download', folderPath, fileId);

    // Ensure directory exists
    const dir = path.dirname(targetLocation);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Generate PDF
    await new Promise((resolve, reject) => {
      custom.generatePdf(
        'payment',
        { filename: folderPath, format: 'A4', targetLocation },
        payment,
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });

    // Read PDF file
    const pdfBuffer = fs.readFileSync(targetLocation);

    // Send email with PDF attachment
    const clientName = payment.client?.name || payment.client?.company || 'Customer';
    const subject = `Payment Receipt #${payment.number} - ${settings['idurar_app_name'] || 'Your Company'}`;

    const result = await sendEmail({
      to: clientEmail,
      from: idurar_app_email,
      subject: subject,
      html: SendPaymentReceipt({
        title: `Payment Receipt #${payment.number}`,
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
      message: `Payment receipt sent successfully to ${clientEmail} via ${result.method}`,
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
