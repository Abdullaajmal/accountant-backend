const mongoose = require('mongoose');
const Model = mongoose.model('LoginHistory');

const getByUser = async (req, res) => {
  try {
    const { userId, limit = 50 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'User ID is required',
      });
    }

    const history = await Model.find({ user: userId })
      .populate('user')
      .sort({ loginTime: -1 })
      .limit(parseInt(limit))
      .exec();

    return res.status(200).json({
      success: true,
      result: history,
      message: 'User login history retrieved successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to get user login history',
    });
  }
};

module.exports = getByUser;
