const mongoose = require('mongoose');
const Model = mongoose.model('Company');

const update = async (req, res) => {
  try {
    const result = await Model.findOneAndUpdate(
      { _id: req.params.id, removed: false },
      { $set: req.body },
      { new: true, runValidators: true }
    ).exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Company not found',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Company updated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to update company',
    });
  }
};

module.exports = update;
