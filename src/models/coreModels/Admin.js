const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: false,
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
  },
  name: { type: String, required: true },
  surname: { type: String },
  photo: {
    type: String,
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: mongoose.Schema.ObjectId,
    ref: 'Role',
  },
  roleName: {
    type: String,
    default: 'staff',
    trim: true,
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
  },
  branch: {
    type: mongoose.Schema.ObjectId,
    ref: 'Branch',
  },
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
  },
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false,
    },
    secret: String,
    backupCodes: [String],
    verified: {
      type: Boolean,
      default: false,
    },
  },
  lastLogin: Date,
  lastLoginIp: String,
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
});

module.exports = mongoose.model('Admin', adminSchema);
