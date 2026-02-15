const mongoose = require('mongoose');

/**
 * Get current logged-in user with fresh permissions from database
 * This ensures permissions are always up-to-date, even if role was updated
 */
const getCurrentUser = async (req, res) => {
  try {
    const Admin = mongoose.model('Admin');
    const Role = mongoose.model('Role');

    if (!req.admin || !req.admin._id) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'User not authenticated',
      });
    }

    const userId = req.admin._id;
    
    // Fetch fresh user data without populate - we'll handle role loading manually
    const user = await Admin.findOne({ _id: userId, removed: false }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'User not found',
      });
    }

    // Load fresh permissions from Role document
    let permissions = {};
    let role = user.role;
    let roleName = user.roleName || 'staff';

    // Load permissions from assigned Role document
    if (role) {
      // Check if role is a valid ObjectId, not a string like "owner"
      const isValidObjectId = mongoose.Types.ObjectId.isValid(role);
      
      if (isValidObjectId) {
        // Role is a valid ObjectId, fetch Role document
        try {
          const roleDoc = await Role.findOne({ _id: role, removed: false, enabled: true }).lean();
          if (roleDoc && roleDoc.permissions) {
            permissions = roleDoc.permissions;
            roleName = roleDoc.roleName || roleName;
          }
        } catch (err) {
          console.error('Error fetching role in getCurrentUser:', err);
          // If fetch fails, treat as no role
          role = null;
        }
      } else {
        // If role is a string like "owner", "admin", etc., treat as roleName
        // This handles legacy data where role field contains roleName string
        roleName = typeof role === 'string' ? role : roleName;
        role = null; // Clear invalid role reference
      }
    }

    // FALLBACK: If role field is null but roleName exists, try to find Role by name
    if (!permissions || Object.keys(permissions).length === 0) {
      if (roleName) {
        const roleDocByName = await Role.findOne({ 
          roleName: { $regex: new RegExp(`^${roleName}$`, 'i') }, 
          removed: false, 
          enabled: true 
        }).lean();
        if (roleDocByName && roleDocByName.permissions) {
          permissions = roleDocByName.permissions;
          role = roleDocByName._id;
          roleName = roleDocByName.roleName;
        }
      }
    }

    // ROOT ADMIN: If no role assigned and no permissions found, grant full access
    if (!permissions || Object.keys(permissions).length === 0 || 
        !Object.values(permissions).some(v => v === true)) {
      if (!role && (!roleName || roleName === 'staff')) {
        roleName = 'admin';
        permissions = {
          dashboard: true,
          customers: true,
          suppliers: true,
          invoices: true,
          quotes: true,
          payments: true,
          expenses: true,
          packages: true,
          visaPackages: true,
          hotelBookings: true,
          accounts: true,
          journalEntries: true,
          bankAccounts: true,
          financialYear: true,
          ledgerPostingRules: true,
          employees: true,
          attendance: true,
          payroll: true,
          commission: true,
          company: true,
          branches: true,
          reports: true,
          financialReports: true,
          businessReports: true,
          documents: true,
          settings: true,
          roles: true,
          users: true,
          loginHistory: true,
          canCreate: true,
          canUpdate: true,
          canDelete: true,
          canView: true,
          canExport: true,
          canApprove: true,
        };
      }
    }

    return res.status(200).json({
      success: true,
      result: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        photo: user.photo,
        role: role && typeof role === 'object' && role._id ? role._id : (role || null),
        roleName,
        permissions,
      },
      message: 'Current user data retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Failed to get current user',
    });
  }
};

module.exports = getCurrentUser;
