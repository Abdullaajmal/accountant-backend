const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  accountName: {
    type: String,
    required: true,
    trim: true,
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true,
  },
  bankName: {
    type: String,
    required: true,
    trim: true,
  },
  branch: {
    type: String,
    trim: true,
  },
  ifscCode: {
    type: String,
    trim: true,
  },
  swiftCode: {
    type: String,
    trim: true,
  },
  accountType: {
    type: String,
    enum: ['Current', 'Savings', 'Fixed Deposit', 'Other'],
    default: 'Current',
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },
  isDefault: {
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
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

bankAccountSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('BankAccount', bankAccountSchema);
