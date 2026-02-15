const mongoose = require('mongoose');

const commissionRecordSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  commission: {
    type: mongoose.Schema.ObjectId,
    ref: 'Commission',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    refPath: 'recipientModel',
    required: true,
  },
  recipientModel: {
    type: String,
    enum: ['Employee', 'Supplier', 'Client'],
  },
  source: {
    type: {
      type: String,
      enum: ['booking', 'package', 'hotel', 'visa', 'invoice'],
      required: true,
    },
    reference: {
      type: mongoose.Schema.ObjectId,
      refPath: 'source.referenceModel',
    },
    referenceModel: {
      type: String,
      enum: ['Booking', 'Package', 'HotelBooking', 'VisaPackage', 'Invoice'],
    },
    referenceNumber: String,
  },
  amount: {
    base: {
      type: Number,
      required: true,
    },
    commission: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending',
  },
  paymentDate: Date,
  paymentReference: String,
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

commissionRecordSchema.index({ recipient: 1, recipientModel: 1, status: 1 });
commissionRecordSchema.index({ 'source.type': 1, 'source.reference': 1 });

module.exports = mongoose.model('CommissionRecord', commissionRecordSchema);
