const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'Employee',
    required: true,
  },
  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
  },
  branch: {
    type: mongoose.Schema.ObjectId,
    ref: 'Branch',
  },
  date: {
    type: Date,
    required: true,
  },
  checkIn: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
  },
  checkOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
  },
  workHours: {
    type: Number,
    default: 0,
  },
  breakHours: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'leave', 'holiday', 'late'],
    default: 'present',
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'annual', 'unpaid', 'other'],
  },
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

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ company: 1, branch: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
