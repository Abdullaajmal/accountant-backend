const Account = require('@/models/appModels/Account');

const listAll = async (req, res) => {
  try {
    const accounts = await Account.find({
      removed: false,
      enabled: true,
    })
      .sort({ accountCode: 1 })
      .populate('parentAccount', 'accountCode accountName')
      .exec();

    return res.status(200).json({
      success: true,
      result: accounts,
      message: 'Successfully fetched all accounts',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = listAll;
