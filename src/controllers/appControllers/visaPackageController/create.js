const mongoose = require('mongoose');
const Model = mongoose.model('VisaPackage');

const create = async (req, res) => {
  try {
    let body = req.body;

    // Generate package code if not provided
    if (!body.packageCode) {
      const name = body.packageName || 'VISA';
      body.packageCode = name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '') + Date.now().toString().slice(-4);
    }

    // Calculate totals
    if (body.cost) {
      const { basePrice = 0, serviceCharge = 0 } = body.cost;
      body.cost.total = basePrice + serviceCharge;

      // Calculate profit if supplier cost is provided
      if (body.supplierCost) {
        body.profit = body.cost.total - body.supplierCost;
      }
    }

    body.createdBy = req.admin._id;

    const result = await new Model(body).save();

    return res.status(200).json({
      success: true,
      result,
      message: 'Visa package created successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to create visa package',
    });
  }
};

module.exports = create;
