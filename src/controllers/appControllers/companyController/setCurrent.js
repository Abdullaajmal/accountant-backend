const mongoose = require('mongoose');
const Model = mongoose.model('Company');
const Admin = mongoose.model('Admin');

const setCurrent = async (req, res) => {
  try {
    const { companyId, branchId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Company ID is required',
      });
    }

    // Verify company exists
    const company = await Model.findOne({ _id: companyId, removed: false, enabled: true });
    if (!company) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Company not found',
      });
    }

    // Update admin's current company and branch
    const updateData = { company: companyId };
    if (branchId) {
      updateData.branch = branchId;
    }

    await Admin.findOneAndUpdate(
      { _id: req.admin._id },
      { $set: updateData }
    );

    return res.status(200).json({
      success: true,
      result: { company, branchId },
      message: 'Current company set successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to set current company',
    });
  }
};

module.exports = setCurrent;
