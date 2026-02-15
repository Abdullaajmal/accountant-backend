const mongoose = require('mongoose');
const Model = mongoose.model('Payroll');

const approve = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Model.findOne({ _id: id, removed: false });
    if (!payroll) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Payroll not found',
      });
    }

    payroll.approvedBy = req.admin._id;
    payroll.approvedAt = new Date();

    await payroll.save();

    return res.status(200).json({
      success: true,
      result: payroll,
      message: 'Payroll approved successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to approve payroll',
    });
  }
};

module.exports = approve;
