const mongoose = require('mongoose');
const Expense = mongoose.model('Expense');
const Supplier = mongoose.model('Supplier');

const apAging = async (req, res) => {
  try {
    const { asOfDate, companyId, branchId } = req.query;
    const asOf = asOfDate ? new Date(asOfDate) : new Date();

    const query = {
      removed: false,
      paymentStatus: { $in: ['unpaid', 'partially'] },
      supplier: { $exists: true, $ne: null },
    };

    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;

    const expenses = await Expense.find(query)
      .populate('supplier')
      .exec();

    const aging = {
      current: [],
      days30: [],
      days60: [],
      days90: [],
      over120: [],
    };

    let totalOutstanding = 0;

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const daysDiff = Math.floor((asOf - expenseDate) / (1000 * 60 * 60 * 24));
      const outstanding = expense.total - (expense.paidAmount || 0);

      if (outstanding <= 0) return;

      totalOutstanding += outstanding;

      const expenseData = {
        expense: expense._id,
        number: expense.number,
        supplier: expense.supplier,
        date: expense.date,
        total: expense.total,
        paidAmount: expense.paidAmount || 0,
        outstanding,
        daysPastDue: daysDiff,
      };

      if (daysDiff <= 30) {
        aging.current.push(expenseData);
      } else if (daysDiff <= 60) {
        aging.days30.push(expenseData);
      } else if (daysDiff <= 90) {
        aging.days60.push(expenseData);
      } else if (daysDiff <= 120) {
        aging.days90.push(expenseData);
      } else {
        aging.over120.push(expenseData);
      }
    });

    const summary = {
      current: aging.current.reduce((sum, exp) => sum + exp.outstanding, 0),
      days30: aging.days30.reduce((sum, exp) => sum + exp.outstanding, 0),
      days60: aging.days60.reduce((sum, exp) => sum + exp.outstanding, 0),
      days90: aging.days90.reduce((sum, exp) => sum + exp.outstanding, 0),
      over120: aging.over120.reduce((sum, exp) => sum + exp.outstanding, 0),
      total: totalOutstanding,
    };

    return res.status(200).json({
      success: true,
      result: {
        asOfDate: asOf,
        summary,
        aging,
      },
      message: 'Accounts Payable Aging report generated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to generate AP Aging report',
    });
  }
};

module.exports = apAging;
