const Joi = require('joi');
const mongoose = require('mongoose');
const { generate: uniqueId } = require('shortid');

const register = async (req, res) => {
  try {
    const Admin = mongoose.model('Admin');
    const AdminPassword = mongoose.model('AdminPassword');
    const Role = mongoose.model('Role');

    const { name, email, password, role, country } = req.body;

    // Validate input
    const objectSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string()
        .email({ tlds: { allow: true } })
        .required(),
      password: Joi.string().min(6).required(),
      role: Joi.string().optional(),
      country: Joi.string().optional(),
    });

    const { error, value } = objectSchema.validate({ name, email, password, role, country });
    if (error) {
      return res.status(409).json({
        success: false,
        result: null,
        error: error,
        message: 'Invalid/Missing credentials.',
        errorMessage: error.message,
      });
    }

    // Check if user already exists
    const existingUser = await Admin.findOne({ email: email.toLowerCase().trim(), removed: false });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        result: null,
        message: 'An account with this email already exists.',
      });
    }

    // Get role if provided
    let roleId = null;
    let roleName = 'staff';

    if (role) {
      if (mongoose.Types.ObjectId.isValid(role)) {
        const roleDoc = await Role.findOne({ _id: role, removed: false, enabled: true });
        if (roleDoc) {
          roleId = roleDoc._id;
          roleName = roleDoc.roleName;
        }
      } else {
        const roleDoc = await Role.findOne({ roleName: role, removed: false, enabled: true });
        if (roleDoc) {
          roleId = roleDoc._id;
          roleName = roleDoc.roleName;
        } else {
          roleName = role;
        }
      }
    }

    // Create password hash
    const newAdminPassword = new AdminPassword();
    const salt = uniqueId();
    const passwordHash = newAdminPassword.generateHash(salt, password);

    // Create admin user with role assignment
    const adminData = {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role: roleId,
      roleName: roleName,
      enabled: true,
    };

    const result = await new Admin(adminData).save();

    // Create password record
    const AdminPasswordData = {
      password: passwordHash,
      emailVerified: false, // Email verification can be done later
      salt: salt,
      user: result._id,
    };
    await new AdminPassword(AdminPasswordData).save();

    return res.status(200).json({
      success: true,
      result: {
        _id: result._id,
        name: result.name,
        email: result.email,
        role: result.role,
        roleName: result.roleName,
      },
      message: 'User registered successfully. Please login.',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to register user',
    });
  }
};

module.exports = register;
