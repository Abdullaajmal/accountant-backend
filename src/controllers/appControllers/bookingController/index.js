const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Booking');

// Load custom methods with error handling
try {
  const create = require('./create');
  const summary = require('./summary');
  const paginatedList = require('./paginatedList');
  const getCommissionReport = require('./getCommissionReport');
  const getProfitAnalysis = require('./getProfitAnalysis');
  const getBusinessInsights = require('./getBusinessInsights');
  const getUpcomingFlights = require('./getUpcomingFlights');
  const getUpcomingHotels = require('./getUpcomingHotels');
  const getDailySales = require('./getDailySales');
  const sendMail = require('./sendMail');

  // Override default methods
  if (create) methods.create = create;
  if (summary) methods.summary = summary;
  if (paginatedList) methods.list = paginatedList;
  if (getCommissionReport) methods.getCommissionReport = getCommissionReport;
  if (getProfitAnalysis) methods.getProfitAnalysis = getProfitAnalysis;
  if (getBusinessInsights) methods.getBusinessInsights = getBusinessInsights;
  if (getUpcomingFlights) methods.getUpcomingFlights = getUpcomingFlights;
  if (getUpcomingHotels) methods.getUpcomingHotels = getUpcomingHotels;
  if (getDailySales) methods.getDailySales = getDailySales;
  if (sendMail) methods.mail = sendMail;
} catch (error) {
  console.error('Error loading bookingController custom methods:', error.message);
  console.error('Stack:', error.stack);
  // Continue with default CRUD methods only
}

module.exports = methods;
