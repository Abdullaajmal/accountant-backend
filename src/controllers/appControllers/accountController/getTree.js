const Account = require('@/models/appModels/Account');

const getTree = async (req, res) => {
  try {
    const accounts = await Account.find({
      removed: false,
      enabled: true,
    })
      .sort({ accountCode: 1 })
      .populate('parentAccount', 'accountCode accountName')
      .exec();

    // Build tree structure
    const accountMap = {};
    const rootAccounts = [];

    accounts.forEach((account) => {
      accountMap[account._id.toString()] = {
        ...account.toObject(),
        children: [],
      };
    });

    accounts.forEach((account) => {
      const accountObj = accountMap[account._id.toString()];
      if (account.parentAccount) {
        const parentId = account.parentAccount._id.toString();
        if (accountMap[parentId]) {
          accountMap[parentId].children.push(accountObj);
        }
      } else {
        rootAccounts.push(accountObj);
      }
    });

    return res.status(200).json({
      success: true,
      result: rootAccounts,
      message: 'Successfully fetched account tree',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = getTree;
