const mongoose = require('mongoose');
const CommissionRecord = mongoose.model('CommissionRecord');

const getRecords = async (req, res) => {
  try {
    const { recipientId, recipientModel, status, startDate, endDate } = req.query;

    const query = { removed: false };

    if (recipientId && recipientModel) {
      query.recipient = recipientId;
      query.recipientModel = recipientModel;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.created = {};
      if (startDate) query.created.$gte = new Date(startDate);
      if (endDate) query.created.$lte = new Date(endDate);
    }

    const records = await CommissionRecord.find(query)
      .populate('commission')
      .populate('recipient')
      .sort({ created: -1 })
      .exec();

    const total = records.reduce((sum, r) => sum + (r.amount.commission || 0), 0);
    const pending = records.filter((r) => r.status === 'pending').reduce((sum, r) => sum + (r.amount.commission || 0), 0);
    const paid = records.filter((r) => r.status === 'paid').reduce((sum, r) => sum + (r.amount.commission || 0), 0);

    return res.status(200).json({
      success: true,
      result: {
        records,
        summary: {
          total,
          pending,
          paid,
          count: records.length,
        },
      },
      message: 'Commission records retrieved successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to get commission records',
    });
  }
};

module.exports = getRecords;
