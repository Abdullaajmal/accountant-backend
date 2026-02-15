const mongoose = require('mongoose');
const Expense = mongoose.model('Expense');
const Supplier = mongoose.model('Supplier');

const supplierPerformance = async (req, res) => {
  try {
    const { startDate, endDate, companyId, branchId } = req.query;

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
      supplier: { $exists: true, $ne: null },
    };

    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;

    const expenses = await Expense.find(query).populate('supplier').exec();

    // Group by supplier
    const supplierData = {};

    expenses.forEach((expense) => {
      const supplierId = expense.supplier?._id?.toString() || 'unknown';
      if (!supplierData[supplierId]) {
        supplierData[supplierId] = {
          supplier: expense.supplier,
          totalAmount: 0,
          transactionCount: 0,
          averageAmount: 0,
          lastTransaction: null,
        };
      }
      supplierData[supplierId].totalAmount += expense.total || 0;
      supplierData[supplierId].transactionCount++;
      if (!supplierData[supplierId].lastTransaction || expense.date > supplierData[supplierId].lastTransaction) {
        supplierData[supplierId].lastTransaction = expense.date;
      }
    });

    // Calculate averages
    const performance = Object.values(supplierData).map((data) => {
      data.averageAmount = data.transactionCount > 0 ? data.totalAmount / data.transactionCount : 0;
      return data;
    });

    // Sort by total amount
    performance.sort((a, b) => b.totalAmount - a.totalAmount);

    return res.status(200).json({
      success: true,
      result: {
        period: { startDate, endDate },
        suppliers: performance,
        summary: {
          totalSuppliers: performance.length,
          totalAmount: performance.reduce((sum, s) => sum + s.totalAmount, 0),
          totalTransactions: performance.reduce((sum, s) => sum + s.transactionCount, 0),
        },
      },
      message: 'Supplier performance report generated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to generate supplier performance report',
    });
  }
};

module.exports = supplierPerformance;
