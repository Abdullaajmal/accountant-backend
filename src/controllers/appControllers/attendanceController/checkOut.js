const mongoose = require('mongoose');
const Model = mongoose.model('Attendance');

const checkOut = async (req, res) => {
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

    const attendance = await Model.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      removed: false,
    });

    if (!attendance || !attendance.checkIn || !attendance.checkIn.time) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Please check in first',
      });
    }

    if (attendance.checkOut && attendance.checkOut.time) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Already checked out today',
      });
    }

    const checkOutTime = new Date();
    attendance.checkOut = {
      time: checkOutTime,
      location: location || {},
    };

    // Calculate work hours
    const checkInTime = new Date(attendance.checkIn.time);
    const workHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // Convert to hours
    attendance.workHours = Math.round(workHours * 100) / 100; // Round to 2 decimal places

    await attendance.save();

    return res.status(200).json({
      success: true,
      result: attendance,
      message: 'Checked out successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to check out',
    });
  }
};

module.exports = checkOut;
