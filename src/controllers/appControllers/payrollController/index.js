const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Payroll');

const generate = require('./generate');
const approve = require('./approve');
const pay = require('./pay');

methods.generate = generate;
methods.approve = approve;
methods.pay = pay;

module.exports = methods;
