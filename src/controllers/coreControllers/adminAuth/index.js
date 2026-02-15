const createAuthMiddleware = require('@/controllers/middlewaresControllers/createAuthMiddleware');
const sendOTP = require('./sendOTP');
const verifyOTP = require('./verifyOTP');
const switchRole = require('./switchRole');
const register = require('./register');

const authMethods = createAuthMiddleware('Admin');

// Add OTP methods
authMethods.sendOTP = sendOTP;
authMethods.verifyOTP = verifyOTP;
authMethods.switchRole = switchRole;
authMethods.register = register;

module.exports = authMethods;
