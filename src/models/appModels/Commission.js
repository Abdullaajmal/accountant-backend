const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  commissionCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['agent', 'staff', 'supplier', 'employee'],
    required: true,
  },
  entity: {
    type: mongoose.Schema.ObjectId,
    refPath: 'entityModel',
  },
  entityModel: {
    type: String,
    enum: ['Employee', 'Supplier', 'Client'],
  },
  commissionStructure: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'tiered'],
      required: true,
    },
    rate: {
      type: Number,
      default: 0,
    },
    tiers: [
      {
        minAmount: {
          type: Number,
          default: 0,
        },
        maxAmount: {
          type: Number,
        },
        rate: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  applicableOn: {
    bookings: {
      type: Boolean,
      default: true,
    },
    packages: {
      type: Boolean,
      default: true,
    },
    hotels: {
      type: Boolean,
      default: false,
    },
    visas: {
      type: Boolean,
      default: false,
    },
    invoices: {
      type: Boolean,
      default: false,
    },
  },
  minAmount: {
    type: Number,
    default: 0,
  },
  maxAmount: {
    type: Number,
  },
  startDate: Date,
  endDate: Date,
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

commissionSchema.index({ type: 1, entity: 1 });
commissionSchema.index({ isActive: 1, enabled: 1 });

module.exports = mongoose.model('Commission', commissionSchema);
