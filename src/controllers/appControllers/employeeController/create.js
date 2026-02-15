const mongoose = require('mongoose');
const Model = mongoose.model('Employee');

const create = async (req, res) => {
  try {
    let body = req.body;

    // Generate employee ID if not provided
    if (!body.employeeId) {
      const year = new Date().getFullYear();
      const lastEmployee = await Model.findOne({
        employeeId: new RegExp(`^EMP-${year}-`),
      })
        .sort({ employeeId: -1 })
        .exec();

      if (lastEmployee) {
        const lastNum = parseInt(lastEmployee.employeeId.split('-')[2]) || 0;
        body.employeeId = `EMP-${year}-${String(lastNum + 1).padStart(5, '0')}`;
      } else {
        body.employeeId = `EMP-${year}-00001`;
      }
    }

    // Calculate net salary
    if (body.salary) {
      const { basic = 0, allowances = 0, deductions = 0 } = body.salary;
      body.salary.net = basic + allowances - deductions;
    }

    body.createdBy = req.admin._id;

    const result = await new Model(body).save();

    return res.status(200).json({
      success: true,
      result,
      message: 'Employee created successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to create employee',
    });
  }
};

module.exports = create;
