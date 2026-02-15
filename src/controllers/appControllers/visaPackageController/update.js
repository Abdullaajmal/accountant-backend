const mongoose = require('mongoose');
const Model = mongoose.model('VisaPackage');

const update = async (req, res) => {
  try {
    // Recalculate totals if cost fields are updated
    if (req.body.cost) {
      const { basePrice = 0, serviceCharge = 0 } = req.body.cost;
      req.body.cost.total = basePrice + serviceCharge;
    }

    // Recalculate profit
    if (req.body.cost && req.body.supplierCost !== undefined) {
      req.body.profit = req.body.cost.total - req.body.supplierCost;
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
        message: 'Visa package not found',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Visa package updated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to update visa package',
    });
  }
};

module.exports = update;
