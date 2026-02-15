const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('LoginHistory');

const getRecent = require('./getRecent');
const getByUser = require('./getByUser');
const getFailedLogins = require('./getFailedLogins');

methods.getRecent = getRecent;
methods.getByUser = getByUser;
methods.getFailedLogins = getFailedLogins;

module.exports = methods;
