const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const { routesList } = require('@/models/utils');

const { globSync } = require('glob');
const path = require('path');

const pattern = './src/controllers/appControllers/*/**/';
const controllerDirectories = globSync(pattern).map((filePath) => {
  return path.basename(filePath);
});

const appControllers = () => {
  const controllers = {};
  const hasCustomControllers = [];

  controllerDirectories.forEach((controllerName) => {
    try {
      const customController = require('@/controllers/appControllers/' + controllerName);

      if (customController) {
        hasCustomControllers.push(controllerName);
        controllers[controllerName] = customController;
        console.log(`✓ Custom controller loaded: ${controllerName}`);
      }
    } catch (err) {
      console.error(`✗ Error loading controller ${controllerName}:`, err.message);
      console.error(`  Error details:`, err.stack);
      // Don't add to hasCustomControllers, so it will use auto-generated controller
    }
  });

  routesList.forEach(({ modelName, controllerName }) => {
    if (!hasCustomControllers.includes(controllerName)) {
      try {
        controllers[controllerName] = createCRUDController(modelName);
        console.log(`✓ Auto-generated controller: ${controllerName} for model ${modelName}`);
      } catch (err) {
        console.error(`✗ Error creating controller ${controllerName} for model ${modelName}:`, err.message);
      }
    }
  });

  return controllers;
};

module.exports = appControllers();
