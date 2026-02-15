const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  documentName: {
    type: String,
    required: true,
    trim: true,
  },
  documentType: {
    type: String,
    enum: [
      'invoice',
      'receipt',
      'contract',
      'passport',
      'visa',
      'cnic',
      'ticket',
      'booking',
      'payment',
      'expense',
      'employee',
      'other',
    ],
    required: true,
  },
  entity: {
    type: mongoose.Schema.ObjectId,
    refPath: 'entityModel',
  },
  entityModel: {
    type: String,
    enum: [
      'Invoice',
      'Payment',
      'Client',
      'Employee',
      'Booking',
      'Package',
      'HotelBooking',
      'VisaPackage',
      'Expense',
      'Other',
    ],
  },
  file: {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  description: String,
  tags: [String],
  isPublic: {
    type: Boolean,
    default: false,
  },
  expiryDate: Date,
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

documentSchema.index({ entity: 1, entityModel: 1 });
documentSchema.index({ documentType: 1, enabled: 1 });

module.exports = mongoose.model('Document', documentSchema);
