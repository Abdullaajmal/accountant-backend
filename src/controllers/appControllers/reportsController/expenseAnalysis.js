const mongoose = require('mongoose');
const Expense = mongoose.model('Expense');

const expenseAnalysis = async (req, res) => {
  try {
    const { startDate, endDate, companyId, branchId, groupBy } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Start date and end date are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const query = {
      date: { $gte: start, $lte: end },
      removed: false,
    };

    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;

    const expenses = await Expense.find(query).exec();

    const total = expenses.reduce((sum, e) => sum + (e.total || 0), 0);

    // Group by category or date
    const grouped = {};
    expenses.forEach((expense) => {
      let key;
      if (groupBy === 'category' && expense.category) {
        key = expense.category;
      } else if (groupBy === 'date') {
        key = expense.date.toISOString().split('T')[0];
      } else {
        key = 'other';
      }

      if (!grouped[key]) {
        grouped[key] = {
          key,
          count: 0,
          total: 0,
          expenses: [],
        };
      }

      grouped[key].count++;
      grouped[key].total += expense.total || 0;
      grouped[key].expenses.push(expense);
    });

    return res.status(200).json({
      success: true,
      result: {
        period: { startDate, endDate },
        summary: {
          total,
          count: expenses.length,
          average: expenses.length > 0 ? total / expenses.length : 0,
        },
        grouped,
      },
      message: 'Expense analysis generated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to generate expense analysis',
    });
  }
};

module.exports = expenseAnalysis;
