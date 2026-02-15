const mongoose = require('mongoose');
const Model = mongoose.model('FinancialYear');

const create = async (req, res) => {
  try {
    let body = req.body;

    if (!body.company) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Company is required',
      });
    }

    if (!body.startDate || !body.endDate) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Start date and end date are required',
      });
    }

    body.createdBy = req.admin._id;
    // Financial years start as 'open' by default - user can change to 'draft' if needed
    // If status is provided in body, use it; otherwise default to 'open'
    if (!body.status) {
      body.status = 'open';
    }

    const result = await new Model(body).save();

    return res.status(200).json({
      success: true,
      result,
      message: 'Financial year created successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to create financial year',
    });
  }
};

module.exports = create;
