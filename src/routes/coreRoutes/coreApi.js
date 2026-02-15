const express = require('express');

const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();

const adminController = require('@/controllers/coreControllers/adminController');
const settingController = require('@/controllers/coreControllers/settingController');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const { singleStorageUpload } = require('@/middlewares/uploadMiddleware');

// Create CRUD controller for Admin to get list method
const adminCRUDController = createCRUDController('Admin');

// //_______________________________ Admin management_______________________________

router.route('/admin/list').get(catchErrors(adminCRUDController.list));
router.route('/admin/listAll').get(catchErrors(adminCRUDController.listAll));
router.route('/admin/me').get(catchErrors(adminController.getCurrentUser)); // Get current user with fresh permissions
router.route('/admin/read/:id').get(catchErrors(adminController.read));

router.route('/admin/password-update/:id').patch(catchErrors(adminController.updatePassword));

//_______________________________ Admin Profile _______________________________

router.route('/admin/profile/password').patch(catchErrors(adminController.updateProfilePassword));
router
  .route('/admin/profile/update')
  .patch(
    singleStorageUpload({ entity: 'admin', fieldName: 'photo', fileType: 'image' }),
    catchErrors(adminController.updateProfile)
  );

// //____________________________________________ API for Global Setting _________________

router.route('/setting/create').post(catchErrors(settingController.create));
router.route('/setting/read/:id').get(catchErrors(settingController.read));
router.route('/setting/update/:id').patch(catchErrors(settingController.update));
//router.route('/setting/delete/:id).delete(catchErrors(settingController.delete));
router.route('/setting/search').get(catchErrors(settingController.search));
router.route('/setting/list').get(catchErrors(settingController.list));
router.route('/setting/listAll').get(catchErrors(settingController.listAll));
router.route('/setting/filter').get(catchErrors(settingController.filter));
router
  .route('/setting/readBySettingKey/:settingKey')
  .get(catchErrors(settingController.readBySettingKey));
router.route('/setting/listBySettingKey').get(catchErrors(settingController.listBySettingKey));
router
  .route('/setting/updateBySettingKey/:settingKey?')
  .patch(catchErrors(settingController.updateBySettingKey));
router
  .route('/setting/upload/:settingKey?')
  .patch(
    // Multer middleware - handle separately as it doesn't return a promise
    (req, res, next) => {
      const multerMiddleware = singleStorageUpload({ entity: 'setting', fieldName: 'settingValue', fileType: 'image' });
      multerMiddleware(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            result: null,
            message: err.message || 'File upload failed',
            error: err,
          });
        }
        next();
      });
    },
    catchErrors(settingController.updateBySettingKey)
  );
router.route('/setting/updateManySetting').patch(catchErrors(settingController.updateManySetting));
module.exports = router;
