const express = require('express');

const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const adminAuth = require('@/controllers/coreControllers/adminAuth');
const roleController = require('@/controllers/appControllers/roleController');

router.route('/login').post(catchErrors(adminAuth.login));
router.route('/register').post(catchErrors(adminAuth.register));
router.route('/sendotp').post(catchErrors(adminAuth.sendOTP));
router.route('/verifyotp').post(catchErrors(adminAuth.verifyOTP));
router.route('/switchrole').post(adminAuth.isValidAuthToken, catchErrors(adminAuth.switchRole));

// Public route for getting roles during registration
router.route('/roles/public').get(catchErrors(async (req, res) => {
  const Role = require('mongoose').model('Role');
  const roles = await Role.find({ removed: false, enabled: true })
    .select('_id roleName roleCode description')
    .sort({ roleName: 1 })
    .exec();
  
  return res.status(200).json({
    success: true,
    result: roles,
    message: 'Roles retrieved successfully',
  });
}));

router.route('/forgetpassword').post(catchErrors(adminAuth.forgetPassword));
router.route('/resetpassword').post(catchErrors(adminAuth.resetPassword));

router.route('/logout').post(adminAuth.isValidAuthToken, catchErrors(adminAuth.logout));

module.exports = router;
