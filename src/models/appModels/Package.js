const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
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
  },
  packageName: {
    type: String,
    required: true,
  },
  destination: String,
  duration: String,
  description: String,
  itinerary: String,
  inclusions: [String],
  exclusions: [String],
  price: {
    type: Number,
    required: true,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  supplier: {
    type: mongoose.Schema.ObjectId,
    ref: 'Supplier',
    autopopulate: true,
  },
  commissionRate: {
    type: Number,
    default: 0,
  },
  images: [String],
  startDate: Date,
  endDate: Date,
  maxTravelers: Number,
  isActive: {
    type: Boolean,
    default: true,
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

packageSchema.plugin(require('mongoose-autopopulate'));
module.exports = mongoose.model('Package', packageSchema);
