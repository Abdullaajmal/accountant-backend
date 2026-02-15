const JournalEntry = require('@/models/appModels/JournalEntry');
const { generate: uniqueId } = require('shortid');

const create = async (req, res) => {
  try {
    const { date, reference, narration, lines, relatedDocument } = req.body;

    // Validate double entry
    let totalDebit = 0;
    let totalCredit = 0;

    lines.forEach((line) => {
      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Debit and Credit must be equal',
      });
    }

    // Generate entry number
    const year = new Date(date).getFullYear();
    const lastEntry = await JournalEntry.findOne({
      entryNumber: new RegExp(`^JE-${year}-`),
    })
      .sort({ entryNumber: -1 })
      .exec();

    let entryNumber;
    if (lastEntry) {
      const lastNum = parseInt(lastEntry.entryNumber.split('-')[2]) || 0;
      entryNumber = `JE-${year}-${String(lastNum + 1).padStart(5, '0')}`;
    } else {
      entryNumber = `JE-${year}-00001`;
    }

    const journalEntry = new JournalEntry({
      entryNumber,
      date,
      reference,
      narration,
      lines,
      totalDebit,
      totalCredit,
      relatedDocument: relatedDocument || { type: 'manual' },
      createdBy: req.admin._id,
    });

    await journalEntry.save();

    return res.status(200).json({
      success: true,
      result: journalEntry,
      message: 'Journal entry created successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = create;
