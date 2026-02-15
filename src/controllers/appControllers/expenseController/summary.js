const mongoose = require('mongoose');
const Model = mongoose.model('Expense');

const summary = async (req, res) => {
  const response = await Model.aggregate([
    {
      $match: {
        removed: false,
      },
    },
    {
      $facet: {
        totalExpenses: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ],
        categoryCounts: [
          {
            $group: {
              _id: '$expenseCategory',
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const totalExpenses = response[0].totalExpenses[0] || { total: 0, count: 0 };
  const categoryCounts = response[0].categoryCounts || [];

  return res.status(200).json({
    success: true,
    result: {
      total: totalExpenses.total,
      count: totalExpenses.count,
      categoryCounts,
    },
    message: 'Expense summary fetched successfully',
  });
};

module.exports = summary;
