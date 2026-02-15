const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Expense');

const create = require('./create');
const summary = require('./summary');

methods.create = create;
methods.summary = summary;

module.exports = methods;
