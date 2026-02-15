const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  expenseNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expenseCategory: {
    type: String,
    enum: [
      'marketing',
      'office',
      'travel',
      'supplier_payment',
      'utilities',
      'salary',
      'commission',
      'other',
    ],
    default: 'other',
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },
  paymentMode: {
    type: mongoose.Schema.ObjectId,
    ref: 'PaymentMode',
    autopopulate: true,
  },
  account: {
    type: mongoose.Schema.ObjectId,
    ref: 'Account',
    autopopulate: true,
  },
  supplier: {
    type: mongoose.Schema.ObjectId,
    ref: 'Supplier',
    autopopulate: true,
  },
  relatedBooking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    autopopulate: true,
  },
  invoice: String,
  receipt: String,
  files: [
    {
      id: String,
      name: String,
      path: String,
      description: String,
      isPublic: {
        type: Boolean,
        default: true,
      },
    },
  ],
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

expenseSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Expense', expenseSchema);
