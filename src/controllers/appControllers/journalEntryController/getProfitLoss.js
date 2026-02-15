const Account = require('@/models/appModels/Account');
const JournalEntry = require('@/models/appModels/JournalEntry');

const getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const accounts = await Account.find({
      removed: false,
      enabled: true,
      accountType: { $in: ['Income', 'Expense'] },
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

    const incomeAccounts = [];
    const expenseAccounts = [];
    let totalIncome = 0;
    let totalExpense = 0;

    Object.values(accountBalances).forEach((acc) => {
      const { account, openingBalance, debit, credit } = acc;
      let balance = openingBalance;

      if (account.accountType === 'Income') {
        balance += credit - debit;
        if (balance !== 0) {
          incomeAccounts.push({
            accountCode: account.accountCode,
            accountName: account.accountName,
            balance: balance,
          });
          totalIncome += balance;
        }
      } else if (account.accountType === 'Expense') {
        balance += debit - credit;
        if (balance !== 0) {
          expenseAccounts.push({
            accountCode: account.accountCode,
            accountName: account.accountName,
            balance: balance,
          });
          totalExpense += balance;
        }
      }
    });

    const netProfit = totalIncome - totalExpense;

    return res.status(200).json({
      success: true,
      result: {
        income: {
          accounts: incomeAccounts,
          total: totalIncome,
        },
        expenses: {
          accounts: expenseAccounts,
          total: totalExpense,
        },
        netProfit,
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
      message: 'Profit & Loss report fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = getProfitLoss;
