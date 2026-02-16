// Vercel Serverless Function Entry Point
// This file wraps the Express app for Vercel deployment

const path = require('path');

// Setup module aliases for Vercel
const moduleAlias = require('module-alias');
moduleAlias.addAliases({
  '@': path.join(__dirname, '../src')
});
require('module-alias/register');

const mongoose = require('mongoose');
const { globSync } = require('glob');

// Make sure we are running node 20+
const [major, minor] = process.versions.node.split('.').map(parseFloat);
if (major < 20) {
  console.log('Please upgrade your node.js version at least 20 or greater. 👌\n ');
}

// Import environmental variables (Vercel automatically loads from env vars)
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Connect to MongoDB
if (process.env.DATABASE) {
  // Check if already connected
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.DATABASE, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    mongoose.connection.on('error', (error) => {
      console.error(`MongoDB Error: ${error.message}`);
    });
    
    mongoose.connection.once('open', () => {
      console.log('✅ MongoDB connected successfully');
    });
  } else {
    console.log('✅ MongoDB already connected');
  }
} else {
  console.warn('⚠️ DATABASE environment variable not set');
}

// Load all models
try {
  const modelsFiles = globSync(path.join(__dirname, '../src/models/**/*.js'));
  for (const filePath of modelsFiles) {
    require(path.resolve(filePath));
  }
} catch (error) {
  console.error('Error loading models:', error);
}

// Import Express app
const app = require('../src/app');

// Export for Vercel serverless function
// Vercel expects a handler function that receives (req, res)
module.exports = (req, res) => {
  // Ensure MongoDB is connected before handling requests
  if (process.env.DATABASE && mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.DATABASE, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  }
  
  // Handle the request with Express app
  return app(req, res);
};
