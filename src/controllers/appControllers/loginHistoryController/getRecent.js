const mongoose = require('mongoose');
const Model = mongoose.model('LoginHistory');

const getRecent = async (req, res) => {
  try {
    const { limit = 50, startDate, endDate } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.loginTime = {};
      if (startDate) query.loginTime.$gte = new Date(startDate);
      if (endDate) query.loginTime.$lte = new Date(endDate);
    }

    const history = await Model.find(query)
      .populate('user')
      .sort({ loginTime: -1 })
      .limit(parseInt(limit))
      .exec();

    return res.status(200).json({
      success: true,
      result: history,
      message: 'Recent login history retrieved successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to get login history',
    });
  }
};

module.exports = getRecent;
