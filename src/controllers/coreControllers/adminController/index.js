const createUserController = require('@/controllers/middlewaresControllers/createUserController');
const getCurrentUser = require('./getCurrentUser');

const adminController = createUserController('Admin');
adminController.getCurrentUser = getCurrentUser;

module.exports = adminController;
