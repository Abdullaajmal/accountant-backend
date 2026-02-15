const Booking = require('@/models/appModels/Booking');
const Expense = require('@/models/appModels/Expense');

const getProfitAnalysis = async (req, res) => {
  try {
    const { bookingId, startDate, endDate } = req.query;

    const query = {
      removed: false,
    };

    if (bookingId) {
      query._id = bookingId;
    }

    if (startDate || endDate) {
      query.bookingDate = {};
      if (startDate) query.bookingDate.$gte = new Date(startDate);
      if (endDate) query.bookingDate.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('supplier', 'name supplierCode commissionRate')
      .populate('package', 'packageName packageCode')
      .populate('client', 'name')
      .exec();

    // Get related expenses for bookings
    const bookingIds = bookings.map((b) => b._id);
    const expenses = await Expense.find({
      removed: false,
      relatedBooking: { $in: bookingIds },
    }).exec();

    const expenseMap = {};
    expenses.forEach((expense) => {
      const bookingId = expense.relatedBooking?.toString();
      if (bookingId) {
        if (!expenseMap[bookingId]) {
          expenseMap[bookingId] = [];
        }
        expenseMap[bookingId].push(expense);
      }
    });

    const profitAnalysis = bookings.map((booking) => {
      const bookingExpenses = expenseMap[booking._id.toString()] || [];
      const totalExpenses = bookingExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const revenue = booking.total || 0;
      const commission = booking.commission || 0;
      const netRevenue = revenue - commission;
      const profit = netRevenue - totalExpenses;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        bookingDate: booking.bookingDate,
        client: booking.client?.name || 'N/A',
        supplier: booking.supplier?.name || 'N/A',
        package: booking.package?.packageName || 'N/A',
        revenue,
        commission,
        netRevenue,
        expenses: totalExpenses,
        expenseCount: bookingExpenses.length,
        profit,
        profitMargin: profitMargin.toFixed(2),
        currency: booking.currency || 'USD',
      };
    });

    const summary = {
      totalBookings: profitAnalysis.length,
      totalRevenue: profitAnalysis.reduce((sum, b) => sum + b.revenue, 0),
      totalCommission: profitAnalysis.reduce((sum, b) => sum + b.commission, 0),
      totalExpenses: profitAnalysis.reduce((sum, b) => sum + b.expenses, 0),
      totalProfit: profitAnalysis.reduce((sum, b) => sum + b.profit, 0),
      averageProfitMargin:
        profitAnalysis.length > 0
          ? profitAnalysis.reduce((sum, b) => sum + parseFloat(b.profitMargin), 0) / profitAnalysis.length
          : 0,
    };

    return res.status(200).json({
      success: true,
      result: {
        summary,
        bookings: profitAnalysis,
      },
      message: 'Profit analysis fetched successfully',
    });
  } catch (error) {
    console.error('❌ Profit Analysis Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Error fetching profit analysis',
    });
  }
};

module.exports = getProfitAnalysis;
