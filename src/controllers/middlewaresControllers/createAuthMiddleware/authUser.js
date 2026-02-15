const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const authUser = async (req, res, { user, databasePassword, password, UserPasswordModel, userModel }) => {
  const isMatch = await bcrypt.compare(databasePassword.salt + password, databasePassword.password);

  if (!isMatch)
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Invalid credentials.',
    });

  if (isMatch === true) {
    // Role-based permissions system
    let permissions = {};
    let role = user.role;
    let roleName = user.roleName || 'staff';

    if (userModel === 'Admin') {
      try {
        const Role = mongoose.model('Role');

        // Load permissions from assigned Role document
        if (role) {
          // Check if role is a valid ObjectId, not a string like "owner"
          const isValidObjectId = mongoose.Types.ObjectId.isValid(role);
          
          if (isValidObjectId) {
            try {
              const roleDoc = await Role.findOne({ _id: role, removed: false, enabled: true });
              if (roleDoc && roleDoc.permissions) {
                permissions = roleDoc.permissions;
                roleName = roleDoc.roleName || roleName;
              }
            } catch (err) {
              console.error('Error fetching role in authUser:', err);
              // If fetch fails, treat as no role
              role = null;
            }
          } else {
            // If role is a string like "owner", "admin", etc., treat as roleName
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
            });
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
          // Check if this is the first admin (no role assigned)
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
      } catch (e) {
        // If Role model is not available, grant full access to avoid breaking login
        console.error('Error loading role permissions:', e);
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

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: req.body.remember ? 365 * 24 + 'h' : '24h' }
    );

    await UserPasswordModel.findOneAndUpdate(
      { user: user._id },
      { $push: { loggedSessions: token } },
      {
        new: true,
      }
    ).exec();

    // .cookie(`token_${user.cloud}`, token, {
    //     maxAge: req.body.remember ? 365 * 24 * 60 * 60 * 1000 : null,
    //     sameSite: 'None',
    //     httpOnly: true,
    //     secure: true,
    //     domain: req.hostname,
    //     path: '/',
    //     Partitioned: true,
    //   })
    res.status(200).json({
      success: true,
      result: {
        _id: user._id,
        name: user.name,
        surname: user.surname,
        role,
        roleName,
        email: user.email,
        photo: user.photo,
        token: token,
        permissions,
        maxAge: req.body.remember ? 365 : null,
        loginTime: Date.now(), // Track login time to prevent immediate logout
      },
      message: 'Successfully login user',
    });
  } else {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Invalid credentials.',
    });
  }
};

module.exports = authUser;
