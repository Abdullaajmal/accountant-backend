const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: true,
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
  },
  branch: {
    type: mongoose.Schema.ObjectId,
    ref: 'Branch',
  },
  payrollPeriod: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  salary: {
    basic: {
      type: Number,
      default: 0,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
    },
    gross: {
      type: Number,
      default: 0,
    },
  },
  deductions: {
    tax: {
      type: Number,
      default: 0,
    },
    providentFund: {
      type: Number,
      default: 0,
    },
    insurance: {
      type: Number,
      default: 0,
    },
    loans: {
      type: Number,
      default: 0,
    },
    other: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  commission: {
    type: Number,
    default: 0,
  },
  netSalary: {
    type: Number,
    required: true,
    default: 0,
  },
  paymentDate: Date,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank', 'cheque'],
  },
  transactionReference: String,
  notes: String,
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
  },
  approvedAt: Date,
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

payrollSchema.index({ employee: 1, 'payrollPeriod.month': 1, 'payrollPeriod.year': 1 }, { unique: true });
payrollSchema.index({ company: 1, branch: 1, 'payrollPeriod.month': 1, 'payrollPeriod.year': 1 });

module.exports = mongoose.model('Payroll', payrollSchema);
