const mongoose = require('mongoose');
const Model = mongoose.model('FinancialYear');

const close = async (req, res) => {
  try {
    const { id } = req.params;
    const { closingBalances } = req.body;

    const financialYear = await Model.findOne({ _id: id, removed: false });
    if (!financialYear) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Financial year not found',
      });
    }

    if (financialYear.status !== 'open') {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Only open financial years can be closed',
      });
    }

    financialYear.status = 'closed';
    financialYear.isCurrent = false;
    financialYear.closedBy = req.admin._id;
    financialYear.closedAt = new Date();
    if (closingBalances) {
      financialYear.closingBalances = closingBalances;
    }

    await financialYear.save();

    return res.status(200).json({
      success: true,
      result: financialYear,
      message: 'Financial year closed successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to close financial year',
    });
  }
};

module.exports = close;
