const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  roleName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  roleCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: String,
  permissions: {
    // Dashboard & Overview
    // NOTE: All permissions default to FALSE for safety.
    // Admin must explicitly enable access per role.
    dashboard: { type: Boolean, default: false },

    // Core Business
    customers: { type: Boolean, default: false },
    suppliers: { type: Boolean, default: false },
    invoices: { type: Boolean, default: false },
    quotes: { type: Boolean, default: false },
    payments: { type: Boolean, default: false },
    expenses: { type: Boolean, default: false },
    packages: { type: Boolean, default: false },

    // Travel Agency
    visaPackages: { type: Boolean, default: false },
    hotelBookings: { type: Boolean, default: false },

    // Accounting
    accounts: { type: Boolean, default: false },
    journalEntries: { type: Boolean, default: false },
    bankAccounts: { type: Boolean, default: false },
    financialYear: { type: Boolean, default: false },
    ledgerPostingRules: { type: Boolean, default: false },

    // HR & Payroll
    employees: { type: Boolean, default: false },
    attendance: { type: Boolean, default: false },
    payroll: { type: Boolean, default: false },
    commission: { type: Boolean, default: false },

    // Company & Organization
    company: { type: Boolean, default: false },
    branches: { type: Boolean, default: false },

    // Reports
    reports: { type: Boolean, default: false },
    financialReports: { type: Boolean, default: false },
    businessReports: { type: Boolean, default: false },

    // Documents
    documents: { type: Boolean, default: false },

    // System
    settings: { type: Boolean, default: false },
    roles: { type: Boolean, default: false },
    users: { type: Boolean, default: false },
    loginHistory: { type: Boolean, default: false },

    // Actions
    canCreate: { type: Boolean, default: false },
    canUpdate: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    canView: { type: Boolean, default: false },
    canExport: { type: Boolean, default: false },
    canApprove: { type: Boolean, default: false },
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

module.exports = mongoose.model('Role', roleSchema);
