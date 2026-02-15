const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  companyCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  legalName: String,
  registrationNumber: String,
  taxId: String,
  gstNumber: String,
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  contact: {
    phone: String,
    email: String,
    website: String,
  },
  logo: {
    id: String,
    name: String,
    path: String,
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  fiscalYearStart: {
    month: {
      type: Number,
      default: 1, // January
      min: 1,
      max: 12,
    },
    day: {
      type: Number,
      default: 1,
      min: 1,
      max: 31,
    },
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
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

companySchema.index({ companyCode: 1 });
companySchema.index({ enabled: 1, removed: 1 });

module.exports = mongoose.model('Company', companySchema);
