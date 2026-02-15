const Account = require('@/models/appModels/Account');
const JournalEntry = require('@/models/appModels/JournalEntry');

const getBalanceSheet = async (req, res) => {
  try {
    const { asOnDate } = req.query;

    const accounts = await Account.find({
      removed: false,
      enabled: true,
      accountType: { $in: ['Asset', 'Liability', 'Equity'] },
    }).exec();

    const query = {
      removed: false,
      isPosted: true,
    };

    if (asOnDate) {
      query.date = { $lte: new Date(asOnDate) };
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

    const assets = [];
    const liabilities = [];
    const equity = [];
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    Object.values(accountBalances).forEach((acc) => {
      const { account, openingBalance, debit, credit } = acc;
      let balance = openingBalance;

      if (account.accountType === 'Asset') {
        balance += debit - credit;
        if (balance !== 0) {
          assets.push({
            accountCode: account.accountCode,
            accountName: account.accountName,
            balance: balance,
          });
          totalAssets += balance;
        }
      } else if (account.accountType === 'Liability') {
        balance += credit - debit;
        if (balance !== 0) {
          liabilities.push({
            accountCode: account.accountCode,
            accountName: account.accountName,
            balance: balance,
          });
          totalLiabilities += balance;
        }
      } else if (account.accountType === 'Equity') {
        balance += credit - debit;
        if (balance !== 0) {
          equity.push({
            accountCode: account.accountCode,
            accountName: account.accountName,
            balance: balance,
          });
          totalEquity += balance;
        }
      }
    });

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return res.status(200).json({
      success: true,
      result: {
        assets: {
          accounts: assets,
          total: totalAssets,
        },
        liabilities: {
          accounts: liabilities,
          total: totalLiabilities,
        },
        equity: {
          accounts: equity,
          total: totalEquity,
        },
        totals: {
          totalAssets,
          totalLiabilities,
          totalEquity,
          totalLiabilitiesAndEquity,
        },
        asOnDate: asOnDate || new Date().toISOString(),
      },
      message: 'Balance Sheet fetched successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = getBalanceSheet;
