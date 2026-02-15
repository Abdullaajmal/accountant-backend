const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  accountCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  accountName: {
    type: String,
    required: true,
    trim: true,
  },
  accountType: {
    type: String,
    required: true,
    enum: ['Asset', 'Liability', 'Equity', 'Income', 'Expense'],
  },
  parentAccount: {
    type: mongoose.Schema.ObjectId,
    ref: 'Account',
    default: null,
  },
  isParent: {
    type: Boolean,
    default: false,
  },
  openingBalance: {
    type: Number,
    default: 0,
  },
  currentBalance: {
    type: Number,
    default: 0,
  },
  description: String,
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

accountSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Account', accountSchema);
