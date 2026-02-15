const mongoose = require('mongoose');

const financialYearSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
    required: true,
  },
  yearName: {
    type: String,
    required: true,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'closed', 'locked'],
    default: 'draft',
  },
  isCurrent: {
    type: Boolean,
    default: false,
  },
  openingBalances: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  closingBalances: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  closedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
  },
  closedAt: Date,
  notes: String,
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

financialYearSchema.index({ company: 1, isCurrent: 1 });
financialYearSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('FinancialYear', financialYearSchema);
