const mongoose = require('mongoose');
const Admin = mongoose.model('Admin');
const OTP = mongoose.model('OTP');
const LoginHistory = mongoose.model('LoginHistory');

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Email is required',
      });
    }

    // Find user
    const user = await Admin.findOne({ email: email.toLowerCase().trim(), removed: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No account with this email has been registered.',
      });
    }

    if (!user.enabled) {
      return res.status(409).json({
        success: false,
        result: null,
        message: 'Your account is disabled, contact your administrator',
      });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase().trim(), verified: false });

    // Create new OTP
    const otp = new OTP({
      email: email.toLowerCase().trim(),
      otp: otpCode,
      expiresAt,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    await otp.save();

    // Send OTP via email
    try {
      const { sendEmail } = require('@/utils/emailService');
      const settings = require('@/settings/useAppSettings');
      const appSettings = await settings();
      const appEmail = appSettings['idurar_app_email'] || process.env.EMAIL_USER || 'noreply@example.com';
      const appName = appSettings['idurar_app_name'] || 'ERP System';

      await sendEmail({
        to: email,
        from: appEmail,
        subject: `${appName} - Your Login OTP`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1890ff;">Your Login OTP</h2>
            <p>Hello,</p>
            <p>Your OTP code for login is:</p>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="font-size: 32px; color: #1890ff; margin: 0; letter-spacing: 8px;">${otpCode}</h1>
            </div>
            <p>This OTP will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #999; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
          </div>
        `,
      });
      console.log(`✅ OTP email sent to ${email}`);
    } catch (emailError) {
      console.error('⚠️ Error sending OTP email:', emailError);
      // Still continue - OTP is saved, user can see it in console for development
    }

    // Log OTP for development (remove in production)
    console.log(`📧 OTP for ${email}: ${otpCode}`);

    // Log login attempt
    try {
      await LoginHistory.create({
        user: user._id,
        email: user.email,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success',
        twoFactorUsed: true,
      });
    } catch (error) {
      console.error('Error creating login history:', error);
    }

    return res.status(200).json({
      success: true,
      result: {
        message: 'OTP sent to your email',
        // Remove this in production - only for testing
        otp: otpCode,
        expiresIn: 10, // minutes
      },
      message: 'OTP sent successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to send OTP',
    });
  }
};

module.exports = sendOTP;
