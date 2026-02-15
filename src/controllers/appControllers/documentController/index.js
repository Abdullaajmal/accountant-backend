const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Document');

const upload = require('./upload');
const linkToEntity = require('./linkToEntity');

methods.upload = upload;
methods.linkToEntity = linkToEntity;

module.exports = methods;
