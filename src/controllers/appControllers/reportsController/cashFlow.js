const mongoose = require('mongoose');
const Payment = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const Expense = mongoose.model('Expense');
const JournalEntry = mongoose.model('JournalEntry');

const cashFlow = async (req, res) => {
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
    };

    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;

    // Cash Inflows
    const payments = await Payment.find(query).exec();
    const cashIn = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Cash Outflows
    const expenses = await Expense.find(query).exec();
    const cashOut = expenses.reduce((sum, e) => sum + (e.total || 0), 0);

    // Journal Entries (cash transactions)
    const journalEntries = await JournalEntry.find({
      ...query,
      status: 'posted',
      'entries.account.accountType': { $in: ['Cash', 'Bank'] },
    }).exec();

    let journalCashIn = 0;
    let journalCashOut = 0;

    journalEntries.forEach((entry) => {
      entry.entries.forEach((e) => {
        if (e.account.accountType === 'Cash' || e.account.accountType === 'Bank') {
          if (e.debit > 0) journalCashOut += e.debit;
          if (e.credit > 0) journalCashIn += e.credit;
        }
      });
    });

    const totalCashIn = cashIn + journalCashIn;
    const totalCashOut = cashOut + journalCashOut;
    const netCashFlow = totalCashIn - totalCashOut;

    // Group by date
    const dailyFlow = {};
    payments.forEach((p) => {
      const dateKey = p.date.toISOString().split('T')[0];
      if (!dailyFlow[dateKey]) dailyFlow[dateKey] = { in: 0, out: 0 };
      dailyFlow[dateKey].in += p.amount || 0;
    });

    expenses.forEach((e) => {
      const dateKey = e.date.toISOString().split('T')[0];
      if (!dailyFlow[dateKey]) dailyFlow[dateKey] = { in: 0, out: 0 };
      dailyFlow[dateKey].out += e.total || 0;
    });

    return res.status(200).json({
      success: true,
      result: {
        period: { startDate, endDate },
        summary: {
          totalCashIn,
          totalCashOut,
          netCashFlow,
        },
        breakdown: {
          payments: cashIn,
          expenses: cashOut,
          journalEntries: {
            in: journalCashIn,
            out: journalCashOut,
          },
        },
        dailyFlow,
      },
      message: 'Cash flow statement generated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to generate cash flow statement',
    });
  }
};

module.exports = cashFlow;
