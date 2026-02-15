const JournalEntry = require('@/models/appModels/JournalEntry');
const Account = require('@/models/appModels/Account');

const getLedger = async (req, res) => {
  try {
    const { accountId, startDate, endDate } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Account ID is required',
      });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Account not found',
      });
    }

    const query = {
      removed: false,
      isPosted: true,
      'lines.account': accountId,
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const journalEntries = await JournalEntry.find(query)
      .sort({ date: 1, entryNumber: 1 })
      .populate('createdBy', 'name email')
      .exec();

    let runningBalance = account.openingBalance || 0;
    const ledgerEntries = [];

    journalEntries.forEach((entry) => {
      const line = entry.lines.find(
        (l) => l.account.toString() === accountId.toString()
      );
      if (line) {
        const debit = line.debit || 0;
        const credit = line.credit || 0;

        if (account.accountType === 'Asset' || account.accountType === 'Expense') {
          runningBalance += debit - credit;
        } else {
          runningBalance += credit - debit;
        }

        ledgerEntries.push({
          date: entry.date,
          entryNumber: entry.entryNumber,
          reference: entry.reference,
          narration: entry.narration || line.description,
          debit,
          credit,
          balance: runningBalance,
        });
      }
    });

    return res.status(200).json({
      success: true,
      result: {
        account: account,
        openingBalance: account.openingBalance || 0,
        entries: ledgerEntries,
        closingBalance: runningBalance,
      },
      message: 'Ledger fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = getLedger;
