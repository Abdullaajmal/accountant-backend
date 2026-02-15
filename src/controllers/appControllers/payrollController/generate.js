const mongoose = require('mongoose');
const Model = mongoose.model('Payroll');
const Employee = mongoose.model('Employee');
const Attendance = mongoose.model('Attendance');

const generate = async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Employee ID, month, and year are required',
      });
    }

    // Check if payroll already exists
    const existing = await Model.findOne({
      employee: employeeId,
      'payrollPeriod.month': month,
      'payrollPeriod.year': year,
      removed: false,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        result: existing,
        message: 'Payroll already exists for this period',
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

    // Get attendance
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const attendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
      removed: false,
    });

    const presentDays = attendance.filter((a) => a.status === 'present' || a.status === 'half-day').length;
    const totalWorkHours = attendance.reduce((sum, a) => sum + (a.workHours || 0), 0);

    // Calculate salary
    const basic = employee.salary.basic || 0;
    const allowances = employee.salary.allowances || 0;
    const dailyRate = basic / 30;
    const calculatedBasic = dailyRate * presentDays;

    const gross = calculatedBasic + allowances;
    const tax = gross * 0.1; // 10% tax (can be configured)
    const totalDeductions = tax + (employee.salary.deductions || 0);
    const netSalary = gross - totalDeductions;

    const payroll = new Model({
      employee: employeeId,
      company: employee.company,
      branch: employee.branch,
      payrollPeriod: { month, year },
      salary: {
        basic: calculatedBasic,
        allowances,
        gross,
      },
      deductions: {
        tax,
        total: totalDeductions,
      },
      netSalary,
      paymentStatus: 'pending',
      createdBy: req.admin._id,
    });

    await payroll.save();

    return res.status(200).json({
      success: true,
      result: payroll,
      message: 'Payroll generated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to generate payroll',
    });
  }
};

module.exports = generate;
