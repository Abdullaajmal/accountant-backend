const mongoose = require('mongoose');
const Model = mongoose.model('Payment');
const Invoice = mongoose.model('Invoice');
const { calculate } = require('@/helpers');

const advancedPayment = async (req, res) => {
  try {
    const { paymentType, invoiceId, amount, clientId, description, paymentMode, currency, date } = req.body;

    if (!paymentType || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Payment type and amount are required',
      });
    }

    let result;
    let allocatedAmount = 0;
    let remainingAmount = 0;
    let overpaymentAmount = 0;

    if (paymentType === 'partial' || paymentType === 'normal') {
      // Partial payment for specific invoice
      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Invoice ID is required for partial payment',
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

      const invoiceTotal = calculate.sub(calculate.sub(invoice.total, invoice.discount || 0), invoice.credit || 0);
      const maxAmount = invoiceTotal;

      if (amount > maxAmount) {
        // Overpayment
        overpaymentAmount = calculate.sub(amount, maxAmount);
        allocatedAmount = maxAmount;
        remainingAmount = 0;

        // Create payment record
        const payment = new Model({
          number: await getNextPaymentNumber(),
          client: invoice.client,
          invoice: invoiceId,
          date: date ? new Date(date) : new Date(),
          amount,
          allocatedAmount,
          remainingAmount: overpaymentAmount,
          overpaymentAmount,
          paymentType: 'overpayment',
          currency: currency || invoice.currency || 'USD',
          paymentMode,
          description: description || `Payment with overpayment of ${overpaymentAmount}`,
          createdBy: req.admin._id,
        });

        result = await payment.save();

        // Update invoice
        await Invoice.findOneAndUpdate(
          { _id: invoiceId },
          {
            $push: { payment: result._id },
            $inc: { credit: allocatedAmount },
            $set: { paymentStatus: 'paid' },
          }
        );

        // Store overpayment for future use
        // Could create a credit note or store in client account
      } else {
        // Normal partial payment
        allocatedAmount = amount;
        remainingAmount = calculate.sub(maxAmount, amount);

        const payment = new Model({
          number: await getNextPaymentNumber(),
          client: invoice.client,
          invoice: invoiceId,
          date: date ? new Date(date) : new Date(),
          amount,
          allocatedAmount,
          remainingAmount,
          paymentType: remainingAmount > 0 ? 'partial' : 'normal',
          currency: currency || invoice.currency || 'USD',
          paymentMode,
          description,
          createdBy: req.admin._id,
        });

        result = await payment.save();

        const newCredit = calculate.add(invoice.credit || 0, amount);
        const invoiceTotal = calculate.sub(calculate.sub(invoice.total, invoice.discount || 0), 0);
        let paymentStatus = 'unpaid';
        if (newCredit >= invoiceTotal) {
          paymentStatus = 'paid';
        } else if (newCredit > 0) {
          paymentStatus = 'partially';
        }

        await Invoice.findOneAndUpdate(
          { _id: invoiceId },
          {
            $push: { payment: result._id },
            $inc: { credit: amount },
            $set: { paymentStatus },
          }
        );
      }
    } else if (paymentType === 'advance') {
      // Advance payment (not linked to any invoice yet)
      if (!clientId) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Client ID is required for advance payment',
        });
      }

      const payment = new Model({
        number: await getNextPaymentNumber(),
        client: clientId,
        date: date ? new Date(date) : new Date(),
        amount,
        allocatedAmount: 0,
        remainingAmount: amount,
        paymentType: 'advance',
        isAdvance: true,
        currency: currency || 'USD',
        paymentMode,
        description: description || 'Advance payment',
        createdBy: req.admin._id,
      });

      result = await payment.save();
    } else if (paymentType === 'overpayment') {
      // Apply overpayment to invoice
      const { overpaymentId, invoiceId: targetInvoiceId } = req.body;

      if (!overpaymentId || !targetInvoiceId) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Overpayment ID and target invoice ID are required',
        });
      }

      const overpayment = await Model.findOne({ _id: overpaymentId, paymentType: 'overpayment', removed: false });
      if (!overpayment) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Overpayment not found',
        });
      }

      const invoice = await Invoice.findOne({ _id: targetInvoiceId, removed: false });
      if (!invoice) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Invoice not found',
        });
      }

      const invoiceTotal = calculate.sub(calculate.sub(invoice.total, invoice.discount || 0), invoice.credit || 0);
      const availableOverpayment = overpayment.remainingAmount || overpayment.overpaymentAmount;
      const applyAmount = availableOverpayment > invoiceTotal ? invoiceTotal : availableOverpayment;

      // Update overpayment
      overpayment.remainingAmount = calculate.sub(availableOverpayment, applyAmount);
      overpayment.adjustedInvoices.push({
        invoice: targetInvoiceId,
        amount: applyAmount,
        date: new Date(),
      });
      await overpayment.save();

      // Update invoice
      const newCredit = calculate.add(invoice.credit || 0, applyAmount);
      let paymentStatus = 'unpaid';
      if (newCredit >= invoiceTotal) {
        paymentStatus = 'paid';
      } else if (newCredit > 0) {
        paymentStatus = 'partially';
      }

      await Invoice.findOneAndUpdate(
        { _id: targetInvoiceId },
        {
          $push: { payment: overpayment._id },
          $inc: { credit: applyAmount },
          $set: { paymentStatus },
        }
      );

      result = {
        overpayment,
        appliedAmount: applyAmount,
        invoice: targetInvoiceId,
      };
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Advanced payment processed successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to process advanced payment',
    });
  }
};

async function getNextPaymentNumber() {
  const Model = mongoose.model('Payment');
  const lastPayment = await Model.findOne({ removed: false }).sort({ number: -1 }).exec();
  return lastPayment ? lastPayment.number + 1 : 1;
}

module.exports = advancedPayment;
