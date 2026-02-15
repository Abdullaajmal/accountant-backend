const mongoose = require('mongoose');
const Model = mongoose.model('Attendance');

const getMonthlyReport = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Employee ID, month, and year are required',
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Model.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
      removed: false,
    }).sort({ date: 1 });

    const presentDays = attendance.filter((a) => a.status === 'present').length;
    const absentDays = attendance.filter((a) => a.status === 'absent').length;
    const halfDays = attendance.filter((a) => a.status === 'half-day').length;
    const leaveDays = attendance.filter((a) => a.status === 'leave').length;
    const totalWorkHours = attendance.reduce((sum, a) => sum + (a.workHours || 0), 0);

    return res.status(200).json({
      success: true,
      result: {
        employee: employeeId,
        month,
        year,
        summary: {
          presentDays,
          absentDays,
          halfDays,
          leaveDays,
          totalWorkHours: Math.round(totalWorkHours * 100) / 100,
        },
        attendance,
      },
      message: 'Monthly attendance report retrieved successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to get monthly report',
    });
  }
};

module.exports = getMonthlyReport;
