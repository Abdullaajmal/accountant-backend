const mongoose = require('mongoose');
const Model = mongoose.model('LedgerPostingRule');
const JournalEntry = mongoose.model('JournalEntry');
const Account = mongoose.model('Account');

const execute = async (req, res) => {
  try {
    const { ruleId, entityId, entityType, data } = req.body;

    if (!ruleId || !entityId || !entityType) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Rule ID, entity ID, and entity type are required',
      });
    }

    const rule = await Model.findOne({ _id: ruleId, isActive: true, removed: false });
    if (!rule) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Posting rule not found or inactive',
      });
    }

    // Check if rule matches trigger
    if (rule.trigger.entity !== entityType) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Rule does not match entity type',
      });
    }

    // Create journal entries based on rule
    const entries = [];
    for (const posting of rule.postings) {
      const account = await Account.findOne({ _id: posting.account, removed: false });
      if (!account) continue;

      let debit = posting.debit || 0;
      let credit = posting.credit || 0;

      // Evaluate formula if provided
      if (posting.formula && data) {
        try {
          // Simple formula evaluation (can be enhanced)
          const formula = posting.formula
            .replace(/total/g, data.total || 0)
            .replace(/amount/g, data.amount || 0)
            .replace(/tax/g, data.tax || 0);
          const result = eval(formula);
          if (posting.debit) debit = result;
          if (posting.credit) credit = result;
        } catch (error) {
          console.error('Error evaluating formula:', error);
        }
      }

      entries.push({
        account: {
          _id: account._id,
          name: account.name,
          accountType: account.accountType,
        },
        debit,
        credit,
        description: posting.description || `${rule.ruleName} - ${entityType}`,
      });
    }

    if (entries.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'No valid entries to post',
      });
    }

    // Create journal entry
    const journalEntry = new JournalEntry({
      number: await getNextJournalNumber(),
      date: new Date(),
      description: `Auto posting: ${rule.ruleName} - ${entityType} ${entityId}`,
      entries,
      status: 'posted',
      createdBy: req.admin._id,
    });

    await journalEntry.save();

    return res.status(200).json({
      success: true,
      result: journalEntry,
      message: 'Ledger posting executed successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to execute ledger posting',
    });
  }
};

async function getNextJournalNumber() {
  const lastEntry = await JournalEntry.findOne({ removed: false }).sort({ number: -1 }).exec();
  return lastEntry ? lastEntry.number + 1 : 1;
}

module.exports = execute;
