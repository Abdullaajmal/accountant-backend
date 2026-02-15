const mongoose = require('mongoose');
const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const { calculate } = require('@/helpers');

const applyAdvance = async (req, res) => {
  try {
    const { advancePaymentId, invoiceId, amount } = req.body;

    if (!advancePaymentId || !invoiceId || !amount) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Advance payment ID, invoice ID, and amount are required',
      });
    }

    const advancePayment = await Model.findOne({
      _id: advancePaymentId,
      paymentType: 'advance',
      isAdvance: true,
      removed: false,
    });

    if (!advancePayment) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Advance payment not found',
      });
    }

    if (advancePayment.remainingAmount < amount) {
      return res.status(400).json({
        success: false,
        result: null,
        message: `Insufficient advance amount. Available: ${advancePayment.remainingAmount}`,
      });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, removed: false });
    if (!invoice) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Invoice not found',
      });
    }

    // Update advance payment
    advancePayment.remainingAmount = calculate.sub(advancePayment.remainingAmount, amount);
    advancePayment.allocatedAmount = calculate.add(advancePayment.allocatedAmount, amount);
    advancePayment.advanceFor = invoiceId;
    advancePayment.adjustedInvoices.push({
      invoice: invoiceId,
      amount,
      date: new Date(),
    });
    await advancePayment.save();

    // Update invoice
    const invoiceTotal = calculate.sub(calculate.sub(invoice.total, invoice.discount || 0), invoice.credit || 0);
    const newCredit = calculate.add(invoice.credit || 0, amount);
    let paymentStatus = 'unpaid';
    if (newCredit >= invoiceTotal) {
      paymentStatus = 'paid';
    } else if (newCredit > 0) {
      paymentStatus = 'partially';
    }

    await Invoice.findOneAndUpdate(
      { _id: invoiceId },
      {
        $push: { payment: advancePayment._id },
        $inc: { credit: amount },
        $set: { paymentStatus },
      }
    );

    return res.status(200).json({
      success: true,
      result: {
        advancePayment,
        invoice,
        appliedAmount: amount,
      },
      message: 'Advance payment applied to invoice successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to apply advance payment',
    });
  }
};

module.exports = applyAdvance;
