const mongoose = require('mongoose');

const visaPackageSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  packageCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  packageName: {
    type: String,
    required: true,
    trim: true,
  },
  destination: {
    country: String,
    city: String,
  },
  visaType: {
    type: String,
    enum: ['tourist', 'business', 'transit', 'student', 'work', 'other'],
    required: true,
  },
  validity: {
    type: Number, // days
    default: 0,
  },
  processingTime: {
    type: Number, // days
    default: 0,
  },
  cost: {
    basePrice: {
      type: Number,
      required: true,
      default: 0,
    },
    serviceCharge: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  supplier: {
    type: mongoose.Schema.ObjectId,
    ref: 'Supplier',
  },
  supplierCost: {
    type: Number,
    default: 0,
  },
  profit: {
    type: Number,
    default: 0,
  },
  requirements: [String],
  documents: [String],
  description: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active',
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

visaPackageSchema.index({ packageCode: 1 });
visaPackageSchema.index({ destination: 1, visaType: 1 });

module.exports = mongoose.model('VisaPackage', visaPackageSchema);
