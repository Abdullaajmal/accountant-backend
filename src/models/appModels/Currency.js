const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  currencyCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  currencyName: {
    type: String,
    required: true,
    trim: true,
  },
  symbol: {
    type: String,
    default: '',
  },
  exchangeRate: {
    type: Number,
    default: 1,
  },
  baseCurrency: {
    type: Boolean,
    default: false,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Currency', currencySchema);
