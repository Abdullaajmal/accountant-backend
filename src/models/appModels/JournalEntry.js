const mongoose = require('mongoose');

const journalLineSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.ObjectId,
    ref: 'Account',
    required: true,
    autopopulate: true,
  },
  debit: {
    type: Number,
    default: 0,
  },
  credit: {
    type: Number,
    default: 0,
  },
  description: String,
});

const journalEntrySchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  entryNumber: {
    type: String,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    required: true,
  },
  reference: String,
  narration: String,
  lines: [journalLineSchema],
  totalDebit: {
    type: Number,
    default: 0,
  },
  totalCredit: {
    type: Number,
    default: 0,
  },
  isPosted: {
    type: Boolean,
    default: false,
  },
  postedDate: Date,
  relatedDocument: {
    type: {
      type: String,
      enum: ['invoice', 'payment', 'booking', 'expense', 'manual'],
    },
    documentId: mongoose.Schema.ObjectId,
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

journalEntrySchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('JournalEntry', journalEntrySchema);
