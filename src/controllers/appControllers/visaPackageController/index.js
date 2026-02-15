const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('VisaPackage');

const create = require('./create');
const update = require('./update');

methods.create = create;
methods.update = update;

module.exports = methods;
