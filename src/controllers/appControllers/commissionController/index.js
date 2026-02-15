const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Commission');

const calculate = require('./calculate');
const getRecords = require('./getRecords');

methods.calculate = calculate;
methods.getRecords = getRecords;

module.exports = methods;
