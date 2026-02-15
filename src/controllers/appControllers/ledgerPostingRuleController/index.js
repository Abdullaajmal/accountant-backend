const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('LedgerPostingRule');

const execute = require('./execute');
const test = require('./test');

methods.execute = execute;
methods.test = test;

module.exports = methods;
