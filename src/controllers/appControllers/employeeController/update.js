const mongoose = require('mongoose');
const Model = mongoose.model('Employee');

const update = async (req, res) => {
  try {
    // Calculate net salary if salary fields are updated
    if (req.body.salary) {
      const { basic = 0, allowances = 0, deductions = 0 } = req.body.salary;
      req.body.salary.net = basic + allowances - deductions;
    }

    const result = await Model.findOneAndUpdate(
      { _id: req.params.id, removed: false },
      { $set: req.body },
      { new: true, runValidators: true }
    ).exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Employee not found',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to update employee',
    });
  }
};

module.exports = update;
