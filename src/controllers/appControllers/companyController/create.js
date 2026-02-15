const mongoose = require('mongoose');
const Model = mongoose.model('Company');

const create = async (req, res) => {
  try {
    let body = req.body;

    // Generate company code if not provided
    if (!body.companyCode) {
      const companyName = body.companyName || 'COMPANY';
      body.companyCode = companyName
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '') + Date.now().toString().slice(-4);
    }

    body.companyCode = body.companyCode.toUpperCase().trim();
    body.createdBy = req.admin._id;

    const result = await new Model(body).save();

    return res.status(200).json({
      success: true,
      result,
      message: 'Company created successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to create company',
    });
  }
};

module.exports = create;
