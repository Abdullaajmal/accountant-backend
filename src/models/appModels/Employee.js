const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
  },
  branch: {
    type: mongoose.Schema.ObjectId,
    ref: 'Branch',
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  phone: String,
  dateOfBirth: Date,
  dateOfJoining: {
    type: Date,
    required: true,
  },
  designation: String,
  department: String,
  employeeType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern', 'agent'],
    default: 'full-time',
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
    deductions: {
      type: Number,
      default: 0,
    },
    net: {
      type: Number,
      default: 0,
    },
  },
  commission: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'tiered'],
    },
    rate: {
      type: Number,
      default: 0,
    },
    onSales: {
      type: Boolean,
      default: false,
    },
    onBookings: {
      type: Boolean,
      default: false,
    },
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountHolderName: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
  },
  documents: [
    {
      documentType: {
        type: String,
        enum: ['cnic', 'passport', 'contract', 'resume', 'other'],
      },
      documentNumber: String,
      file: {
        id: String,
        name: String,
        path: String,
      },
      issueDate: Date,
      expiryDate: Date,
    },
  ],
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on-leave'],
    default: 'active',
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
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

employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ company: 1, branch: 1 });
employeeSchema.index({ status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
