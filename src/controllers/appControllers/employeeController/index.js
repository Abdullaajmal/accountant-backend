const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Employee');

const create = require('./create');
const update = require('./update');
const calculateSalary = require('./calculateSalary');

methods.create = create;
methods.update = update;
methods.calculateSalary = calculateSalary;

module.exports = methods;
