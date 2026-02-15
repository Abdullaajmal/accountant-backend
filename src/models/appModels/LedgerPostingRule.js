const mongoose = require('mongoose');

const ledgerPostingRuleSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  ruleName: {
    type: String,
    required: true,
    trim: true,
  },
  ruleCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
  },
  trigger: {
    entity: {
      type: String,
      enum: ['invoice', 'payment', 'expense', 'booking', 'package', 'hotel', 'visa'],
      required: true,
    },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'status-change'],
      required: true,
    },
    conditions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  postings: [
    {
      account: {
        type: mongoose.Schema.ObjectId,
        ref: 'Account',
        required: true,
      },
      debit: {
        type: Number,
        default: 0,
      },
      credit: {
        type: Number,
        default: 0,
      },
      formula: String, // e.g., "total * 0.18" for GST
      description: String,
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
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

ledgerPostingRuleSchema.index({ ruleCode: 1 });
ledgerPostingRuleSchema.index({ company: 1, isActive: 1 });

module.exports = mongoose.model('LedgerPostingRule', ledgerPostingRuleSchema);
