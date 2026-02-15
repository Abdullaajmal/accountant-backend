const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('FinancialYear');

const create = require('./create');
const open = require('./open');
const close = require('./close');
const getCurrent = require('./getCurrent');

methods.create = create;
methods.open = open;
methods.close = close;
methods.getCurrent = getCurrent;

module.exports = methods;
