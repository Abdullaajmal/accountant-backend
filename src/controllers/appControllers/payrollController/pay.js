const mongoose = require('mongoose');
const Model = mongoose.model('Payroll');

const pay = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionReference, paymentDate } = req.body;

    const payroll = await Model.findOne({ _id: id, removed: false });
    if (!payroll) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Payroll not found',
      });
    }

    payroll.paymentStatus = 'paid';
    payroll.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    payroll.paymentMethod = paymentMethod;
    payroll.transactionReference = transactionReference;

    await payroll.save();

    return res.status(200).json({
      success: true,
      result: payroll,
      message: 'Payroll marked as paid successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to mark payroll as paid',
    });
  }
};

module.exports = pay;
