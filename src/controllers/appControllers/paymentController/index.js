const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Payment');

const create = require('./create');
const summary = require('./summary');
const update = require('./update');
const remove = require('./remove');
const sendMail = require('./sendMail');
const paginatedList = require('./paginatedList');
const advancedPayment = require('./advancedPayment');
const applyAdvance = require('./applyAdvance');

methods.mail = sendMail;
methods.create = create;
methods.update = update;
methods.delete = remove;
methods.summary = summary;
methods.list = paginatedList;
methods.advancedPayment = advancedPayment;
methods.applyAdvance = applyAdvance;

module.exports = methods;
