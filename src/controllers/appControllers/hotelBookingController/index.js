const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('HotelBooking');

const create = require('./create');
const update = require('./update');
const calculateCommission = require('./calculateCommission');

methods.create = create;
methods.update = update;
methods.calculateCommission = calculateCommission;

module.exports = methods;
