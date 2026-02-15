const mongoose = require('mongoose');
const Model = mongoose.model('Attendance');

const checkIn = async (req, res) => {
  try {
    const { employeeId, location } = req.body;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Employee ID is required',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    let attendance = await Model.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      removed: false,
    });

    if (attendance && attendance.checkIn && attendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Already checked in today',
      });
    }

    if (!attendance) {
      // Create new attendance record
      attendance = new Model({
        employee: employeeId,
        date: today,
        status: 'present',
        createdBy: req.admin._id,
      });
    }

    attendance.checkIn = {
      time: new Date(),
      location: location || {},
    };

    await attendance.save();

    return res.status(200).json({
      success: true,
      result: attendance,
      message: 'Checked in successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to check in',
    });
  }
};

module.exports = checkIn;
