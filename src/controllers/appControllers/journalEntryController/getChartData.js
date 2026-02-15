const Account = require('@/models/appModels/Account');
const JournalEntry = require('@/models/appModels/JournalEntry');

const getChartData = async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query;

    const currentDate = new Date();
    const defaultStartDate = startDate ? new Date(startDate) : new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
    const defaultEndDate = endDate ? new Date(endDate) : currentDate;

    const accounts = await Account.find({
      removed: false,
      enabled: true,
      accountType: { $in: ['Income', 'Expense'] },
    }).exec();

    const query = {
      removed: false,
      isPosted: true,
      date: {
        $gte: defaultStartDate,
        $lte: defaultEndDate,
      },
    };

    const journalEntries = await JournalEntry.find(query)
      .sort({ date: 1 })
      .exec();

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

    // Group by period
    const periodData = {};
    journalEntries.forEach((entry) => {
      const entryDate = new Date(entry.date);
      let periodKey;
      
      if (period === 'monthly') {
        periodKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'weekly') {
        const week = Math.ceil(entryDate.getDate() / 7);
        periodKey = `${entryDate.getFullYear()}-W${week}`;
      } else {
        periodKey = entryDate.toISOString().split('T')[0];
      }

      if (!periodData[periodKey]) {
        periodData[periodKey] = { income: 0, expense: 0 };
      }

      entry.lines.forEach((line) => {
        const accountId = line.account.toString();
        if (accountBalances[accountId]) {
          const account = accountBalances[accountId].account;
          if (account.accountType === 'Income') {
            periodData[periodKey].income += line.credit - line.debit;
          } else if (account.accountType === 'Expense') {
            periodData[periodKey].expense += line.debit - line.credit;
          }
        }
      });
    });

    const chartData = Object.keys(periodData)
      .sort()
      .map((key) => ({
        period: key,
        income: periodData[key].income,
        expense: periodData[key].expense,
        profit: periodData[key].income - periodData[key].expense,
      }));

    return res.status(200).json({
      success: true,
      result: {
        summary: {
          totalIncome,
          totalExpense,
          totalProfit: totalIncome - totalExpense,
        },
        chartData,
        period,
      },
      message: 'Chart data fetched successfully',
    });
  } catch (error) {
    console.error('❌ Chart Data Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Error fetching chart data',
    });
  }
};

module.exports = getChartData;
