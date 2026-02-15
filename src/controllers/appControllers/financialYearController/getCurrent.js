const mongoose = require('mongoose');
const Model = mongoose.model('FinancialYear');

const getCurrent = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Company ID is required',
      });
    }

    const currentFY = await Model.findOne({
      company: companyId,
      isCurrent: true,
      status: 'open',
      removed: false,
    });

    if (!currentFY) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No current financial year found',
      });
    }

    return res.status(200).json({
      success: true,
      result: currentFY,
      message: 'Current financial year retrieved successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to get current financial year',
    });
  }
};

module.exports = getCurrent;
