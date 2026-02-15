const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Attendance');

const checkIn = require('./checkIn');
const checkOut = require('./checkOut');
const getMonthlyReport = require('./getMonthlyReport');

methods.checkIn = checkIn;
methods.checkOut = checkOut;
methods.getMonthlyReport = getMonthlyReport;

module.exports = methods;
