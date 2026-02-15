const mongoose = require('mongoose');
const Payment = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const Expense = mongoose.model('Expense');
const JournalEntry = mongoose.model('JournalEntry');

const dayBook = async (req, res) => {
  try {
    const { date, companyId, branchId } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Date is required',
      });
    }

    const targetDate = new Date(date);
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const query = {
      date: { $gte: start, $lte: end },
      removed: false,
    };

    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;

    const payments = await Payment.find(query).populate('client invoice').exec();
    const invoices = await Invoice.find(query).populate('client').exec();
    const expenses = await Expense.find(query).exec();
    const journalEntries = await JournalEntry.find({
      ...query,
      status: 'posted',
    })
      .populate('entries.account')
      .exec();

    const transactions = [];

    // Add payments
    payments.forEach((p) => {
      transactions.push({
        type: 'payment',
        id: p._id,
        date: p.date,
        description: `Payment from ${p.client?.name || 'Client'}`,
        reference: p.ref || p.number,
        debit: 0,
        credit: p.amount || 0,
        balance: p.amount || 0,
      });
    });

    // Add invoices
    invoices.forEach((inv) => {
      transactions.push({
        type: 'invoice',
        id: inv._id,
        date: inv.date,
        description: `Invoice to ${inv.client?.name || 'Client'}`,
        reference: inv.number,
        debit: inv.total || 0,
        credit: 0,
        balance: -(inv.total || 0),
      });
    });

    // Add expenses
    expenses.forEach((e) => {
      transactions.push({
        type: 'expense',
        id: e._id,
        date: e.date,
        description: e.name || 'Expense',
        reference: e.number || '',
        debit: e.total || 0,
        credit: 0,
        balance: -(e.total || 0),
      });
    });

    // Add journal entries
    journalEntries.forEach((je) => {
      je.entries.forEach((entry) => {
        transactions.push({
          type: 'journal',
          id: je._id,
          date: je.date,
          description: je.description || 'Journal Entry',
          reference: je.number || '',
          account: entry.account?.name || '',
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          balance: (entry.credit || 0) - (entry.debit || 0),
        });
      });
    });

    // Sort by date and time
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    transactions.forEach((t) => {
      runningBalance += t.balance;
      t.runningBalance = runningBalance;
    });

    const totalDebit = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);

    return res.status(200).json({
      success: true,
      result: {
        date: targetDate,
        summary: {
          totalDebit,
          totalCredit,
          balance: totalCredit - totalDebit,
          transactionCount: transactions.length,
        },
        transactions,
      },
      message: 'Day book generated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to generate day book',
    });
  }
};

module.exports = dayBook;
