const jwt = require('jsonwebtoken');

const mongoose = require('mongoose');

const isValidAuthToken = async (req, res, next, { userModel, jwtSecret = 'JWT_SECRET' }) => {
  try {
    const UserPassword = mongoose.model(userModel + 'Password');
    const User = mongoose.model(userModel);

    // const token = req.cookies[`token_${cloud._id}`];
    const authHeader = req.headers['authorization'];
    let token = null;
    
    // Extract token from Authorization header
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }
    
    // Validate token exists and is not malformed
    if (!token || token === 'undefined' || token === 'null' || token.trim().length === 0) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'No authentication token or token is malformed, authorization denied.',
        error: {
          name: 'JsonWebTokenError',
          message: 'jwt malformed',
        },
        jwtExpired: true,
      });
    }

    // Verify token
    let verified;
    try {
      verified = jwt.verify(token.trim(), process.env[jwtSecret]);
      
      // If verification succeeds, verified will contain the decoded token
      if (!verified || !verified.id) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Token verification failed: Invalid token payload.',
          error: {
            name: 'JsonWebTokenError',
            message: 'Invalid token payload',
          },
          jwtExpired: true,
        });
      }
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        result: null,
        message: jwtError.message || 'Token verification failed, authorization denied.',
        error: {
          name: jwtError.name || 'JsonWebTokenError',
          message: jwtError.message || 'jwt malformed',
        },
        jwtExpired: true,
      });
    }

    const userPasswordPromise = UserPassword.findOne({ user: verified.id, removed: false });
    // Fetch user without populate - we'll handle role loading manually to avoid ObjectId errors
    const userPromise = User.findOne({ _id: verified.id, removed: false }).lean();

    const [user, userPassword] = await Promise.all([userPromise, userPasswordPromise]);

    if (!user)
      return res.status(401).json({
        success: false,
        result: null,
        message: "User doens't Exist, authorization denied.",
        jwtExpired: true,
      });

    const { loggedSessions } = userPassword;

    if (!loggedSessions.includes(token))
      return res.status(401).json({
        success: false,
        result: null,
        message: 'User is already logout try to login, authorization denied.',
        jwtExpired: true,
      });
    else {
      // REAL-TIME PERMISSION LOADING: Load fresh permissions from database on every request
      if (userModel === 'Admin') {
        let permissions = {};
        let role = user.role;
        let roleName = user.roleName || 'staff';

        try {
          const Role = mongoose.model('Role');

          // Load permissions from assigned Role document (fresh from database)
          if (role) {
            // Check if role is a valid ObjectId, not a string like "owner"
            const isValidObjectId = mongoose.Types.ObjectId.isValid(role);
            
            if (isValidObjectId) {
              // Role is a valid ObjectId, fetch Role document
              try {
                const roleDoc = await Role.findOne({ _id: role, removed: false, enabled: true });
                if (roleDoc && roleDoc.permissions) {
                  permissions = roleDoc.permissions;
                  roleName = roleDoc.roleName || roleName;
                }
              } catch (err) {
                console.error('Error fetching role:', err);
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

          // Attach fresh permissions to user object
          user.permissions = permissions;
          user.roleName = roleName;
        } catch (e) {
          console.error('Error loading permissions in middleware:', e);
          // Grant full access on error to avoid breaking requests
          user.permissions = {
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

      const reqUserName = userModel.toLowerCase();
      req[reqUserName] = user;
      next();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
      controller: 'isValidAuthToken',
      jwtExpired: true,
    });
  }
};

module.exports = isValidAuthToken;
