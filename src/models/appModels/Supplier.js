const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  supplierCode: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  supplierType: {
    type: String,
    enum: ['hotel', 'airline', 'transport', 'tour_operator', 'other'],
    default: 'other',
  },
  contactPerson: String,
  phone: String,
  email: String,
  address: String,
  country: String,
  website: String,
  taxNumber: String,
  commissionRate: {
    type: Number,
    default: 0,
  },
  paymentTerms: String,
  accountNumber: String,
  bankName: String,
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

supplierSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Supplier', supplierSchema);
