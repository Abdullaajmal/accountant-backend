const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Admin = mongoose.model('Admin');
const OTP = mongoose.model('OTP');
const LoginHistory = mongoose.model('LoginHistory');
const Role = mongoose.model('Role');

const verifyOTP = async (req, res) => {
  try {
    const { email, otp, roleId } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Email and OTP are required',
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

    // Find OTP
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase().trim(),
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'OTP not found or expired. Please request a new OTP.',
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        result: null,
        message: 'Too many attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      // Log failed attempt
      try {
        await LoginHistory.create({
          user: user._id,
          email: user.email,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          status: 'failed',
          failureReason: 'Invalid OTP',
          twoFactorUsed: true,
        });
      } catch (error) {
        console.error('Error creating login history:', error);
      }

      return res.status(400).json({
        success: false,
        result: null,
        message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`,
      });
    }

    // OTP verified - mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Get user roles
    let selectedRole = user.role;
    let selectedRoleName = user.roleName;

    // If roleId is provided and user has Manager role (full access), allow role switching
    if (roleId) {
      const userRole = await Role.findOne({ _id: user.role, removed: false });
      if (userRole && userRole.roleCode === 'MANAGER') {
        const role = await Role.findOne({ _id: roleId, removed: false });
        if (role) {
          selectedRole = role._id;
          selectedRoleName = role.roleName || user.roleName;
        }
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: selectedRole,
        roleName: selectedRoleName,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: req.body.remember ? 365 * 24 + 'h' : '24h' }
    );

    // Update user last login
    user.lastLogin = new Date();
    user.lastLoginIp = req.ip || req.connection.remoteAddress;
    user.loginAttempts = 0;
    await user.save();

    // Get all available roles for this user (for role switching)
    const availableRoles = [];
    const userRole = await Role.findOne({ _id: user.role, removed: false });
    if (userRole && userRole.roleCode === 'MANAGER') {
      // Manager role has access to all roles
      const allRoles = await Role.find({ removed: false, enabled: true }).exec();
      availableRoles.push(...allRoles.map((r) => ({ _id: r._id, roleName: r.roleName })));
    } else {
      // Regular users can only use their assigned role
      if (user.role) {
        const role = await Role.findOne({ _id: user.role, removed: false });
        if (role) {
          availableRoles.push({ _id: role._id, roleName: role.roleName });
        }
      }
      if (user.roleName) {
        availableRoles.push({ _id: null, roleName: user.roleName });
      }
    }

    // Get role permissions
    let permissions = {};
    if (selectedRole) {
      const roleDoc = await Role.findOne({ _id: selectedRole, removed: false });
      if (roleDoc && roleDoc.permissions) {
        permissions = roleDoc.permissions;
      }
    } else if (user.role) {
      const roleDoc = await Role.findOne({ _id: user.role, removed: false });
      if (roleDoc && roleDoc.permissions) {
        permissions = roleDoc.permissions;
      }
    } else if (userRole && userRole.roleCode === 'MANAGER') {
      // Manager role has all permissions from role definition
      if (userRole.permissions) {
        permissions = userRole.permissions;
      }
    }

    // Log successful login
    try {
      await LoginHistory.create({
        user: user._id,
        email: user.email,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'success',
        twoFactorUsed: true,
        company: user.company,
        branch: user.branch,
      });
    } catch (error) {
      console.error('Error creating login history:', error);
    }

    return res.status(200).json({
      success: true,
      result: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        role: selectedRole,
        roleName: selectedRoleName,
        email: user.email,
        photo: user.photo,
        token: token,
        availableRoles: availableRoles,
        permissions: permissions,
        maxAge: req.body.remember ? 365 : null,
      },
      message: 'Successfully logged in',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to verify OTP',
    });
  }
};

module.exports = verifyOTP;
