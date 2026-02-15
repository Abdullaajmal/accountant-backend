const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Admin = mongoose.model('Admin');
const Role = mongoose.model('Role');

const switchRole = async (req, res) => {
  try {
    const { roleId } = req.body;
    const user = req.admin;

    if (!user) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'User not authenticated',
      });
    }

    // Only Manager role can switch roles
    const userRole = await Role.findOne({ _id: user.role, removed: false });
    if (!userRole || userRole.roleCode !== 'MANAGER') {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'You do not have permission to switch roles',
      });
    }

    let selectedRole = null;
    let selectedRoleName = user.roleName;

    if (roleId) {
      const role = await Role.findOne({ _id: roleId, removed: false, enabled: true });
      if (!role) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Role not found',
        });
      }
      selectedRole = role._id;
      selectedRoleName = role.roleName || user.roleName;
    } else {
      // Switch back to original role
      selectedRole = user.role;
      selectedRoleName = user.roleName;
    }

    // Generate new token with selected role
    const token = jwt.sign(
      {
        id: user._id,
        role: selectedRole,
        roleName: selectedRoleName,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Get all available roles
    const allRoles = await Role.find({ removed: false, enabled: true }).exec();
    const availableRoles = allRoles.map((r) => ({ _id: r._id, roleName: r.roleName }));

    // Get role permissions
    let permissions = {};
    if (selectedRole) {
      const roleDoc = await Role.findOne({ _id: selectedRole, removed: false });
      if (roleDoc && roleDoc.permissions) {
        permissions = roleDoc.permissions;
      }
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
      },
      message: 'Role switched successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to switch role',
    });
  }
};

module.exports = switchRole;
