const JournalEntry = require('@/models/appModels/JournalEntry');
const Account = require('@/models/appModels/Account');

const unpost = async (req, res) => {
  try {
    const { id } = req.params;
    const journalEntry = await JournalEntry.findById(id);

    if (!journalEntry) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Journal entry not found',
      });
    }

    if (!journalEntry.isPosted) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Journal entry is not posted',
      });
    }

    // Reverse account balances
    for (const line of journalEntry.lines) {
      const account = await Account.findById(line.account);
      if (account) {
        account.currentBalance -= line.debit || 0;
        account.currentBalance += line.credit || 0;
        await account.save();
      }
    }

    journalEntry.isPosted = false;
    journalEntry.postedDate = null;
    await journalEntry.save();

    return res.status(200).json({
      success: true,
      result: journalEntry,
      message: 'Journal entry unposted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = unpost;
