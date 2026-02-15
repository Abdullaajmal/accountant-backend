const mongoose = require('mongoose');
const Employee = mongoose.model('Employee');
const Attendance = mongoose.model('Attendance');

const calculateSalary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Employee ID, month, and year are required',
      });
    }

    const employee = await Employee.findOne({ _id: employeeId, removed: false });
    if (!employee) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Employee not found',
      });
    }

    // Get attendance for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
      removed: false,
    });

    const presentDays = attendance.filter((a) => a.status === 'present' || a.status === 'half-day').length;
    const totalWorkHours = attendance.reduce((sum, a) => sum + (a.workHours || 0), 0);

    // Calculate salary components
    const basic = employee.salary.basic || 0;
    const allowances = employee.salary.allowances || 0;
    const deductions = employee.salary.deductions || 0;

    // Calculate based on present days (assuming 30 days in a month)
    const dailyRate = basic / 30;
    const calculatedBasic = dailyRate * presentDays;

    const gross = calculatedBasic + allowances;
    const net = gross - deductions;

    return res.status(200).json({
      success: true,
      result: {
        employee: employeeId,
        month,
        year,
        presentDays,
        totalWorkHours,
        salary: {
          basic: calculatedBasic,
          allowances,
          deductions,
          gross,
          net,
        },
        attendance: attendance.length,
      },
      message: 'Salary calculated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to calculate salary',
    });
  }
};

module.exports = calculateSalary;
