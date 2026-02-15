const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: String,
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
  },
  browser: String,
  os: String,
  location: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number,
  },
  loginTime: {
    type: Date,
    default: Date.now,
  },
  logoutTime: Date,
  sessionDuration: Number, // in minutes
  status: {
    type: String,
    enum: ['success', 'failed', 'blocked', 'expired'],
    default: 'success',
  },
  failureReason: String,
  twoFactorUsed: {
    type: Boolean,
    default: false,
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
  },
  branch: {
    type: mongoose.Schema.ObjectId,
    ref: 'Branch',
  },
});

loginHistorySchema.index({ user: 1, loginTime: -1 });
loginHistorySchema.index({ ipAddress: 1, loginTime: -1 });
loginHistorySchema.index({ status: 1, loginTime: -1 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
