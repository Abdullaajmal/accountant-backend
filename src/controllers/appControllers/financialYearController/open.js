const mongoose = require('mongoose');
const Model = mongoose.model('FinancialYear');

const open = async (req, res) => {
  try {
    const { id } = req.params;

    const financialYear = await Model.findOne({ _id: id, removed: false });
    if (!financialYear) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Financial year not found',
      });
    }

    // Close all other financial years for this company
    await Model.updateMany(
      {
        company: financialYear.company,
        _id: { $ne: id },
        status: { $in: ['open', 'draft'] },
      },
      {
        $set: {
          status: 'closed',
          isCurrent: false,
        },
      }
    );

    // Open this financial year
    financialYear.status = 'open';
    financialYear.isCurrent = true;
    await financialYear.save();

    return res.status(200).json({
      success: true,
      result: financialYear,
      message: 'Financial year opened successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to open financial year',
    });
  }
};

module.exports = open;
