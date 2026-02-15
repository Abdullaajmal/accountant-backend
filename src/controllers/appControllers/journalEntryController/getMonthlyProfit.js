const Account = require('@/models/appModels/Account');
const JournalEntry = require('@/models/appModels/JournalEntry');

const getMonthlyProfit = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const accounts = await Account.find({
      removed: false,
      enabled: true,
      accountType: { $in: ['Income', 'Expense'] },
    }).exec();

    const query = {
      removed: false,
      isPosted: true,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const journalEntries = await JournalEntry.find(query).exec();

    const accountBalances = {};

    accounts.forEach((account) => {
      accountBalances[account._id.toString()] = {
        account: account,
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

    let totalIncome = 0;
    let totalExpense = 0;

    Object.values(accountBalances).forEach((acc) => {
      const { account, debit, credit } = acc;

      if (account.accountType === 'Income') {
        totalIncome += credit - debit;
      } else if (account.accountType === 'Expense') {
        totalExpense += debit - credit;
      }
    });

    const netProfit = totalIncome - totalExpense;

    return res.status(200).json({
      success: true,
      result: {
        month: targetMonth,
        year: targetYear,
        totalIncome,
        totalExpense,
        netProfit,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
      message: 'Monthly profit fetched successfully',
    });
  } catch (error) {
    console.error('❌ Monthly Profit Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Error fetching monthly profit',
    });
  }
};

module.exports = getMonthlyProfit;
