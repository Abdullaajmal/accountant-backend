const Account = require('@/models/appModels/Account');
const JournalEntry = require('@/models/appModels/JournalEntry');

const getTrialBalance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const accounts = await Account.find({
      removed: false,
      enabled: true,
    }).exec();

    const query = {
      removed: false,
      isPosted: true,
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const journalEntries = await JournalEntry.find(query).exec();

    const accountBalances = {};

    accounts.forEach((account) => {
      accountBalances[account._id.toString()] = {
        account: account,
        openingBalance: account.openingBalance || 0,
        debit: 0,
        credit: 0,
      };
    });

    journalEntries.forEach((entry) => {
      entry.lines.forEach((line) => {
        const accountId = line.account.toString();
        if (accountBalances[accountId]) {
          accountBalances[accountId].debit += line.debit || 0;
          accountBalances[accountId].credit += line.credit || 0;
        }
      });
    });

    const trialBalance = Object.values(accountBalances).map((acc) => {
      const { account, openingBalance, debit, credit } = acc;
      let balance = openingBalance;

      if (account.accountType === 'Asset' || account.accountType === 'Expense') {
        balance += debit - credit;
      } else {
        balance += credit - debit;
      }

      return {
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        openingBalance,
        debit,
        credit,
        balance,
      };
    });

    const totalDebit = trialBalance.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = trialBalance.reduce((sum, acc) => sum + acc.credit, 0);
    const totalBalance = trialBalance.reduce((sum, acc) => sum + acc.balance, 0);

    return res.status(200).json({
      success: true,
      result: {
        trialBalance,
        totals: {
          totalDebit,
          totalCredit,
          totalBalance,
        },
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
      message: 'Trial balance fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = getTrialBalance;
