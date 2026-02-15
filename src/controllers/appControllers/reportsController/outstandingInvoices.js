const mongoose = require('mongoose');
const Invoice = mongoose.model('Invoice');
const { calculate } = require('@/helpers');

const outstandingInvoices = async (req, res) => {
  try {
    const { companyId, branchId, clientId } = req.query;

    const query = {
      removed: false,
      paymentStatus: { $in: ['unpaid', 'partially'] },
    };

    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;
    if (clientId) query.client = clientId;

    const invoices = await Invoice.find(query)
      .populate('client')
      .sort({ date: -1 })
      .exec();

    const outstanding = invoices.map((invoice) => {
      const outstandingAmount = calculate.sub(
        calculate.sub(invoice.total, invoice.discount || 0),
        invoice.credit || 0
      );

      return {
        invoice: invoice._id,
        number: invoice.number,
        date: invoice.date,
        client: invoice.client,
        total: invoice.total,
        discount: invoice.discount || 0,
        credit: invoice.credit || 0,
        outstanding: outstandingAmount,
        paymentStatus: invoice.paymentStatus,
        daysPastDue: Math.floor((new Date() - new Date(invoice.date)) / (1000 * 60 * 60 * 24)),
      };
    });

    const totalOutstanding = outstanding.reduce((sum, inv) => sum + inv.outstanding, 0);

    return res.status(200).json({
      success: true,
      result: {
        summary: {
          totalInvoices: outstanding.length,
          totalOutstanding,
        },
        invoices: outstanding,
      },
      message: 'Outstanding invoices retrieved successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to get outstanding invoices',
    });
  }
};

module.exports = outstandingInvoices;
