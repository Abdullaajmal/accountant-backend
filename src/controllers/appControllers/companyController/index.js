const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Company');

const create = require('./create');
const update = require('./update');
const setCurrent = require('./setCurrent');

methods.create = create;
methods.update = update;
methods.setCurrent = setCurrent;

module.exports = methods;
