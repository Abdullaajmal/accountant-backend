const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('JournalEntry');

const create = require('./create');
const post = require('./post');
const unpost = require('./unpost');
const getLedger = require('./getLedger');
const getTrialBalance = require('./getTrialBalance');
const getProfitLoss = require('./getProfitLoss');
const getBalanceSheet = require('./getBalanceSheet');
const getMonthlyProfit = require('./getMonthlyProfit');
const getChartData = require('./getChartData');

methods.create = create;
methods.post = post;
methods.unpost = unpost;
methods.getLedger = getLedger;
methods.getTrialBalance = getTrialBalance;
methods.getProfitLoss = getProfitLoss;
methods.getBalanceSheet = getBalanceSheet;
methods.getMonthlyProfit = getMonthlyProfit;
methods.getChartData = getChartData;

module.exports = methods;
