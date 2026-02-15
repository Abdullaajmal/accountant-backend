const mongoose = require('mongoose');
const Model = mongoose.model('LedgerPostingRule');

const test = async (req, res) => {
  try {
    const { ruleId, testData } = req.body;

    if (!ruleId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Rule ID is required',
      });
    }

    const rule = await Model.findOne({ _id: ruleId, removed: false });
    if (!rule) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Posting rule not found',
      });
    }

    // Simulate posting without creating actual entries
    const simulatedEntries = rule.postings.map((posting) => {
      let debit = posting.debit || 0;
      let credit = posting.credit || 0;

      if (posting.formula && testData) {
        try {
          const formula = posting.formula
            .replace(/total/g, testData.total || 0)
            .replace(/amount/g, testData.amount || 0)
            .replace(/tax/g, testData.tax || 0);
          const result = eval(formula);
          if (posting.debit) debit = result;
          if (posting.credit) credit = result;
        } catch (error) {
          console.error('Error evaluating formula:', error);
        }
      }

      return {
        account: posting.account,
        debit,
        credit,
        description: posting.description,
      };
    });

    return res.status(200).json({
      success: true,
      result: {
        rule,
        simulatedEntries,
        totalDebit: simulatedEntries.reduce((sum, e) => sum + (e.debit || 0), 0),
        totalCredit: simulatedEntries.reduce((sum, e) => sum + (e.credit || 0), 0),
        balanced: Math.abs(
          simulatedEntries.reduce((sum, e) => sum + (e.debit || 0), 0) -
            simulatedEntries.reduce((sum, e) => sum + (e.credit || 0), 0)
        ) < 0.01,
      },
      message: 'Rule test completed successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to test rule',
    });
  }
};

module.exports = test;
