const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');

const routerApp = (entity, controller) => {
  // Register special routes FIRST (before generic routes) to ensure proper matching
  // Booking special routes - must be registered before /booking/list
  if (entity === 'booking') {
    console.log(`🔍 Registering booking routes. Controller methods:`, Object.keys(controller));
    
    if (controller['getUpcomingFlights'] && typeof controller['getUpcomingFlights'] === 'function') {
      router.route(`/${entity}/upcomingflights`).get(catchErrors(controller['getUpcomingFlights']));
      console.log(`✓ Special route registered: /api/${entity}/upcomingflights`);
    } else {
      console.log(`✗ getUpcomingFlights not found or not a function. Type: ${typeof controller['getUpcomingFlights']}`);
    }
    
    if (controller['getUpcomingHotels'] && typeof controller['getUpcomingHotels'] === 'function') {
      router.route(`/${entity}/upcominghotels`).get(catchErrors(controller['getUpcomingHotels']));
      console.log(`✓ Special route registered: /api/${entity}/upcominghotels`);
    } else {
      console.log(`✗ getUpcomingHotels not found or not a function. Type: ${typeof controller['getUpcomingHotels']}`);
    }
    
    if (controller['getDailySales'] && typeof controller['getDailySales'] === 'function') {
      router.route(`/${entity}/dailysales`).get(catchErrors(controller['getDailySales']));
      console.log(`✓ Special route registered: /api/${entity}/dailysales`);
    } else {
      console.log(`✗ getDailySales not found or not a function. Type: ${typeof controller['getDailySales']}`);
    }
    
    if (controller['getCommissionReport'] && typeof controller['getCommissionReport'] === 'function') {
      router.route(`/${entity}/commissionreport`).get(catchErrors(controller['getCommissionReport']));
      console.log(`✓ Special route registered: /api/${entity}/commissionreport`);
    }
    
    if (controller['getProfitAnalysis'] && typeof controller['getProfitAnalysis'] === 'function') {
      router.route(`/${entity}/profitanalysis`).get(catchErrors(controller['getProfitAnalysis']));
      console.log(`✓ Special route registered: /api/${entity}/profitanalysis`);
    }
    
    if (controller['getBusinessInsights'] && typeof controller['getBusinessInsights'] === 'function') {
      router.route(`/${entity}/businessinsights`).get(catchErrors(controller['getBusinessInsights']));
      console.log(`✓ Special route registered: /api/${entity}/businessinsights`);
    }
  }

  // Generic CRUD routes
  router.route(`/${entity}/create`).post(catchErrors(controller['create']));
  router.route(`/${entity}/read/:id`).get(catchErrors(controller['read']));
  router.route(`/${entity}/update/:id`).patch(catchErrors(controller['update']));
  router.route(`/${entity}/delete/:id`).delete(catchErrors(controller['delete']));
  router.route(`/${entity}/search`).get(catchErrors(controller['search']));
  router.route(`/${entity}/list`).get(catchErrors(controller['list']));
  router.route(`/${entity}/listAll`).get(catchErrors(controller['listAll']));
  router.route(`/${entity}/filter`).get(catchErrors(controller['filter']));
  router.route(`/${entity}/summary`).get(catchErrors(controller['summary']));

  if (entity === 'invoice' || entity === 'quote' || entity === 'payment' || entity === 'booking') {
    router.route(`/${entity}/mail`).post(catchErrors(controller['mail']));
  }

  if (entity === 'quote') {
    router.route(`/${entity}/convert/:id`).get(catchErrors(controller['convert']));
    if (controller['getConversionRate']) {
      router.route(`/${entity}/conversionrate`).get(catchErrors(controller['getConversionRate']));
    }
  }

  // Journal Entry special routes
  if (entity === 'journalentry') {
    router.route(`/${entity}/post/:id`).post(catchErrors(controller['post']));
    router.route(`/${entity}/unpost/:id`).post(catchErrors(controller['unpost']));
    router.route(`/${entity}/ledger`).get(catchErrors(controller['getLedger']));
    router.route(`/${entity}/trialbalance`).get(catchErrors(controller['getTrialBalance']));
    router.route(`/${entity}/profitloss`).get(catchErrors(controller['getProfitLoss']));
    router.route(`/${entity}/balancesheet`).get(catchErrors(controller['getBalanceSheet']));
    if (controller['getMonthlyProfit']) {
      router.route(`/${entity}/monthlyprofit`).get(catchErrors(controller['getMonthlyProfit']));
    }
    if (controller['getChartData']) {
      router.route(`/${entity}/chartdata`).get(catchErrors(controller['getChartData']));
    }
  }

  // Account special routes
  if (entity === 'account') {
    router.route(`/${entity}/tree`).get(catchErrors(controller['getTree']));
  }

  // Company special routes
  if (entity === 'company') {
    if (controller['setCurrent']) {
      router.route(`/${entity}/setcurrent`).post(catchErrors(controller['setCurrent']));
    }
  }

  // Financial Year special routes
  if (entity === 'financialyear') {
    if (controller['open']) {
      router.route(`/${entity}/open/:id`).post(catchErrors(controller['open']));
    }
    if (controller['close']) {
      router.route(`/${entity}/close/:id`).post(catchErrors(controller['close']));
    }
    if (controller['getCurrent']) {
      router.route(`/${entity}/current`).get(catchErrors(controller['getCurrent']));
    }
  }

  // Employee special routes
  if (entity === 'employee') {
    if (controller['calculateSalary']) {
      router.route(`/${entity}/calculatesalary`).post(catchErrors(controller['calculateSalary']));
    }
  }

  // Attendance special routes
  if (entity === 'attendance') {
    if (controller['checkIn']) {
      router.route(`/${entity}/checkin`).post(catchErrors(controller['checkIn']));
    }
    if (controller['checkOut']) {
      router.route(`/${entity}/checkout`).post(catchErrors(controller['checkOut']));
    }
    if (controller['getMonthlyReport']) {
      router.route(`/${entity}/monthlyreport`).get(catchErrors(controller['getMonthlyReport']));
    }
  }

  // Payroll special routes
  if (entity === 'payroll') {
    if (controller['generate']) {
      router.route(`/${entity}/generate`).post(catchErrors(controller['generate']));
    }
    if (controller['approve']) {
      router.route(`/${entity}/approve/:id`).post(catchErrors(controller['approve']));
    }
    if (controller['pay']) {
      router.route(`/${entity}/pay/:id`).post(catchErrors(controller['pay']));
    }
  }

  // Commission special routes
  if (entity === 'commission') {
    if (controller['calculate']) {
      router.route(`/${entity}/calculate`).post(catchErrors(controller['calculate']));
    }
    if (controller['getRecords']) {
      router.route(`/${entity}/records`).get(catchErrors(controller['getRecords']));
    }
  }

  // Hotel Booking special routes
  if (entity === 'hotelbooking') {
    if (controller['calculateCommission']) {
      router.route(`/${entity}/calculatecommission/:id`).post(catchErrors(controller['calculateCommission']));
    }
  }

  // Payment special routes
  if (entity === 'payment') {
    if (controller['advancedPayment']) {
      router.route(`/${entity}/advanced`).post(catchErrors(controller['advancedPayment']));
    }
    if (controller['applyAdvance']) {
      router.route(`/${entity}/applyadvance`).post(catchErrors(controller['applyAdvance']));
    }
  }

  // Ledger Posting Rule special routes
  if (entity === 'ledgerpostingrule') {
    if (controller['execute']) {
      router.route(`/${entity}/execute`).post(catchErrors(controller['execute']));
    }
    if (controller['test']) {
      router.route(`/${entity}/test`).post(catchErrors(controller['test']));
    }
  }

  // Login History special routes
  if (entity === 'loginhistory') {
    if (controller['getRecent']) {
      router.route(`/${entity}/recent`).get(catchErrors(controller['getRecent']));
    }
    if (controller['getByUser']) {
      router.route(`/${entity}/byuser`).get(catchErrors(controller['getByUser']));
    }
    if (controller['getFailedLogins']) {
      router.route(`/${entity}/failed`).get(catchErrors(controller['getFailedLogins']));
    }
  }

  // Document special routes
  if (entity === 'document') {
    if (controller['upload']) {
      router.route(`/${entity}/upload`).post(catchErrors(controller['upload']));
    }
    if (controller['linkToEntity']) {
      router.route(`/${entity}/link/:id`).post(catchErrors(controller['linkToEntity']));
    }
  }

};

routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  if (controller) {
    routerApp(entity, controller);
    console.log(`✓ Route registered: /api/${entity} -> ${controllerName}`);
    
    // Log special methods for booking
    if (entity === 'booking') {
      console.log(`  - getCommissionReport: ${typeof controller['getCommissionReport']}`);
    }
  } else {
    console.error(`✗ Controller ${controllerName} not found for entity ${entity}`);
  }
});

// Global search route
const searchController = require('@/controllers/appControllers/searchController');
if (searchController && searchController.globalSearch) {
  router.route('/search/global').get(catchErrors(searchController.globalSearch));
  console.log('✓ Global search route registered: /api/search/global');
}

// Reports routes
const reportsController = require('@/controllers/appControllers/reportsController');
if (reportsController) {
  router.route('/reports/cashflow').get(catchErrors(reportsController.cashFlow));
  router.route('/reports/araging').get(catchErrors(reportsController.arAging));
  router.route('/reports/apaging').get(catchErrors(reportsController.apAging));
  router.route('/reports/daybook').get(catchErrors(reportsController.dayBook));
  router.route('/reports/outstandinginvoices').get(catchErrors(reportsController.outstandingInvoices));
  router.route('/reports/expenseanalysis').get(catchErrors(reportsController.expenseAnalysis));
  router.route('/reports/customerprofitability').get(catchErrors(reportsController.customerProfitability));
  router.route('/reports/supplierperformance').get(catchErrors(reportsController.supplierPerformance));
  console.log('✓ Reports routes registered');
}

// Role Management
const roleController = require('@/controllers/appControllers/roleController');
const createDefaultRoles = require('@/controllers/appControllers/roleController/createDefaultRoles');

router
  .route('/role')
  .post(roleController.create)
  .get(roleController.listAll);

// Add list route for SelectAsync compatibility
router.route('/role/list').get(catchErrors(roleController.list));

router
  .route('/role/:id')
  .get(roleController.read)
  .put(roleController.update)
  .delete(roleController.delete);

router.route('/role/default/create').post(createDefaultRoles);

module.exports = router;
