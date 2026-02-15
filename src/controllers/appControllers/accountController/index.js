const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Account');

const listAll = require('./listAll');
const getTree = require('./getTree');

methods.listAll = listAll;
methods.getTree = getTree;

module.exports = methods;
