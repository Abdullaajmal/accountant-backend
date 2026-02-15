const mongoose = require('mongoose');

const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const custom = require('@/controllers/pdfController');

const { calculate } = require('@/helpers');

const create = async (req, res) => {
  // Creating a new document in the collection
  if (req.body.amount === 0) {
    return res.status(202).json({
      success: false,
      result: null,
      message: `The Minimum Amount couldn't be 0`,
    });
  }

  const currentInvoice = await Invoice.findOne({
    _id: req.body.invoice,
    removed: false,
  });

  const {
    total: previousTotal,
    discount: previousDiscount,
    credit: previousCredit,
  } = currentInvoice;

  const maxAmount = calculate.sub(calculate.sub(previousTotal, previousDiscount), previousCredit);

  if (req.body.amount > maxAmount) {
    return res.status(202).json({
      success: false,
      result: null,
      message: `The Max Amount you can add is ${maxAmount}`,
    });
  }
  req.body['createdBy'] = req.admin._id;

  const result = await Model.create(req.body);

  const fileId = 'payment-' + result._id + '.pdf';
  const updatePath = await Model.findOneAndUpdate(
    {
      _id: result._id.toString(),
      removed: false,
    },
    { pdf: fileId },
    {
      new: true,
    }
  ).exec();
  // Returning successfull response

  const { _id: paymentId, amount } = result;
  const { id: invoiceId, total, discount, credit } = currentInvoice;

  let paymentStatus =
    calculate.sub(total, discount) === calculate.add(credit, amount)
      ? 'paid'
      : calculate.add(credit, amount) > 0
      ? 'partially'
      : 'unpaid';

  const invoiceUpdate = await Invoice.findOneAndUpdate(
    { _id: req.body.invoice },
    {
      $push: { payment: paymentId.toString() },
      $inc: { credit: amount },
      $set: { paymentStatus: paymentStatus },
    },
    {
      new: true, // return the new result instead of the old one
      runValidators: true,
    }
  ).exec();

  // Auto-create journal entry for payment
  try {
    const { createPaymentJournalEntry } = require('@/helpers/autoJournalEntry');
    await createPaymentJournalEntry(updatePath, invoiceUpdate, req.admin._id);
  } catch (error) {
    console.error('Error creating auto journal entry for payment:', error);
    // Don't fail the payment creation if journal entry fails
  }

  // Create audit log
  try {
    const { createAuditLog } = require('@/middlewares/auditLog');
    await createAuditLog(req, 'create', 'payment', updatePath._id, { amount: updatePath.amount });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }

  return res.status(200).json({
    success: true,
    result: updatePath,
    message: 'Payment Invoice created successfully',
  });
};

module.exports = create;
