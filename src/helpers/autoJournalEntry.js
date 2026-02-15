const JournalEntry = require('@/models/appModels/JournalEntry');
const Account = require('@/models/appModels/Account');
const mongoose = require('mongoose');

/**
 * Auto-generate journal entry number
 */
const generateEntryNumber = async () => {
  const year = new Date().getFullYear();
  const lastEntry = await JournalEntry.findOne({
    entryNumber: new RegExp(`^JE-${year}-`),
  })
    .sort({ entryNumber: -1 })
    .exec();

  let sequence = 1;
  if (lastEntry) {
    const lastSequence = parseInt(lastEntry.entryNumber.split('-')[2]) || 0;
    sequence = lastSequence + 1;
  }

  return `JE-${year}-${sequence.toString().padStart(4, '0')}`;
};

/**
 * Find or create default account by account code
 */
const findAccountByCode = async (accountCode) => {
  let account = await Account.findOne({ accountCode, removed: false, enabled: true }).exec();
  
  if (!account) {
    // Try to find by partial match or create a default account
    // For now, return null if not found - the system should have accounts set up
    console.warn(`Account with code ${accountCode} not found`);
    return null;
  }
  
  return account;
};

/**
 * Create auto journal entry for Invoice
 * Debit: Accounts Receivable
 * Credit: Revenue
 */
const createInvoiceJournalEntry = async (invoice, createdBy) => {
  try {
    // Find default accounts
    const accountsReceivable = await findAccountByCode('AR001'); // Accounts Receivable
    const revenueAccount = await findAccountByCode('REV001'); // Revenue
    
    if (!accountsReceivable || !revenueAccount) {
      console.warn('Default accounts not found for invoice journal entry. Skipping auto journal entry.');
      return null;
    }

    const entryNumber = await generateEntryNumber();
    
    const journalEntry = new JournalEntry({
      entryNumber,
      date: invoice.date,
      reference: `INV-${invoice.number}`,
      narration: `Invoice ${invoice.number} - ${invoice.client?.name || 'Client'}`,
      lines: [
        {
          account: accountsReceivable._id,
          debit: invoice.total,
          credit: 0,
          description: `Invoice ${invoice.number}`,
        },
        {
          account: revenueAccount._id,
          debit: 0,
          credit: invoice.total,
          description: `Revenue from Invoice ${invoice.number}`,
        },
      ],
      totalDebit: invoice.total,
      totalCredit: invoice.total,
      isPosted: true, // Auto-post invoice entries
      postedDate: new Date(),
      relatedDocument: {
        type: 'invoice',
        documentId: invoice._id,
      },
      createdBy,
    });

    const savedEntry = await journalEntry.save();
    console.log(`✓ Auto journal entry created for Invoice ${invoice.number}: ${entryNumber}`);
    return savedEntry;
  } catch (error) {
    console.error('Error creating invoice journal entry:', error);
    return null;
  }
};

/**
 * Create auto journal entry for Payment
 * Debit: Cash/Bank (based on payment mode)
 * Credit: Accounts Receivable
 */
const createPaymentJournalEntry = async (payment, invoice, createdBy) => {
  try {
    // Find default accounts
    const accountsReceivable = await findAccountByCode('AR001'); // Accounts Receivable
    // Try to find cash account - default to CASH001
    let cashAccount = await findAccountByCode('CASH001'); // Cash
    
    // If payment mode exists, try to find account linked to payment mode
    // For now, use default cash account
    
    if (!accountsReceivable || !cashAccount) {
      console.warn('Default accounts not found for payment journal entry. Skipping auto journal entry.');
      return null;
    }

    const entryNumber = await generateEntryNumber();
    
    const journalEntry = new JournalEntry({
      entryNumber,
      date: payment.date,
      reference: `PAY-${payment.number}`,
      narration: `Payment ${payment.number} for Invoice ${invoice?.number || 'N/A'}`,
      lines: [
        {
          account: cashAccount._id,
          debit: payment.amount,
          credit: 0,
          description: `Payment ${payment.number}`,
        },
        {
          account: accountsReceivable._id,
          debit: 0,
          credit: payment.amount,
          description: `Payment received for Invoice ${invoice?.number || 'N/A'}`,
        },
      ],
      totalDebit: payment.amount,
      totalCredit: payment.amount,
      isPosted: true, // Auto-post payment entries
      postedDate: new Date(),
      relatedDocument: {
        type: 'payment',
        documentId: payment._id,
      },
      createdBy,
    });

    const savedEntry = await journalEntry.save();
    console.log(`✓ Auto journal entry created for Payment ${payment.number}: ${entryNumber}`);
    return savedEntry;
  } catch (error) {
    console.error('Error creating payment journal entry:', error);
    return null;
  }
};

/**
 * Create auto journal entry for Expense
 * Debit: Expense Account (from expense.account or default)
 * Credit: Cash/Bank (based on payment mode)
 */
const createExpenseJournalEntry = async (expense, createdBy) => {
  try {
    // Use expense account if provided, otherwise find default expense account
    let expenseAccount = expense.account;
    if (!expenseAccount) {
      // Try to find default expense account by category
      const defaultExpenseCode = `EXP-${expense.expenseCategory?.toUpperCase() || 'OTHER'}`;
      expenseAccount = await findAccountByCode(defaultExpenseCode);
      
      // If still not found, use generic expense account
      if (!expenseAccount) {
        expenseAccount = await findAccountByCode('EXP001');
      }
    }
    
    // Find cash account
    const cashAccount = await findAccountByCode('CASH001'); // Cash
    
    if (!expenseAccount || !cashAccount) {
      console.warn('Default accounts not found for expense journal entry. Skipping auto journal entry.');
      return null;
    }

    // Convert expenseAccount to ObjectId if it's not already
    const expenseAccountId = expenseAccount._id || expenseAccount;

    const entryNumber = await generateEntryNumber();
    
    const journalEntry = new JournalEntry({
      entryNumber,
      date: expense.date,
      reference: expense.expenseNumber,
      narration: `Expense ${expense.expenseNumber} - ${expense.description}`,
      lines: [
        {
          account: expenseAccountId,
          debit: expense.amount,
          credit: 0,
          description: expense.description,
        },
        {
          account: cashAccount._id,
          debit: 0,
          credit: expense.amount,
          description: `Payment for expense ${expense.expenseNumber}`,
        },
      ],
      totalDebit: expense.amount,
      totalCredit: expense.amount,
      isPosted: true, // Auto-post expense entries
      postedDate: new Date(),
      relatedDocument: {
        type: 'expense',
        documentId: expense._id,
      },
      createdBy,
    });

    const savedEntry = await journalEntry.save();
    console.log(`✓ Auto journal entry created for Expense ${expense.expenseNumber}: ${entryNumber}`);
    return savedEntry;
  } catch (error) {
    console.error('Error creating expense journal entry:', error);
    return null;
  }
};

module.exports = {
  createInvoiceJournalEntry,
  createPaymentJournalEntry,
  createExpenseJournalEntry,
  generateEntryNumber,
  findAccountByCode,
};
