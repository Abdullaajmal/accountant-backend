const mongoose = require('mongoose');
const Model = mongoose.model('Expense');

const create = async (req, res) => {
  let body = req.body;

  // Generate expense number
  const year = new Date().getFullYear();
  const lastExpense = await Model.findOne({
    expenseNumber: new RegExp(`^EXP-${year}-`),
  })
    .sort({ expenseNumber: -1 })
    .exec();

  let expenseNumber;
  if (lastExpense) {
    const lastNum = parseInt(lastExpense.expenseNumber.split('-')[2]) || 0;
    expenseNumber = `EXP-${year}-${String(lastNum + 1).padStart(5, '0')}`;
  } else {
    expenseNumber = `EXP-${year}-00001`;
  }

  body['expenseNumber'] = expenseNumber;
  body['createdBy'] = req.admin._id;

  const result = await new Model(body).save();

  // Auto-create journal entry for expense
  try {
    const { createExpenseJournalEntry } = require('@/helpers/autoJournalEntry');
    await createExpenseJournalEntry(result, req.admin._id);
  } catch (error) {
    console.error('Error creating auto journal entry for expense:', error);
    // Don't fail the expense creation if journal entry fails
  }

  // Create audit log
  try {
    const { createAuditLog } = require('@/middlewares/auditLog');
    await createAuditLog(req, 'create', 'expense', result._id, { amount: result.amount });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }

  return res.status(200).json({
    success: true,
    result: result,
    message: 'Expense created successfully',
  });
};

module.exports = create;
