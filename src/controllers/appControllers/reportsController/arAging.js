const mongoose = require('mongoose');
const Invoice = mongoose.model('Invoice');
const { calculate } = require('@/helpers');

const arAging = async (req, res) => {
  try {
    const { asOfDate, companyId, branchId } = req.query;
    const asOf = asOfDate ? new Date(asOfDate) : new Date();

    const query = {
      removed: false,
      paymentStatus: { $in: ['unpaid', 'partially'] },
    };

    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;

    const invoices = await Invoice.find(query)
      .populate('client')
      .exec();

    const aging = {
      current: [], // 0-30 days
      days30: [], // 31-60 days
      days60: [], // 61-90 days
      days90: [], // 91-120 days
      over120: [], // Over 120 days
    };

    let totalOutstanding = 0;

    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.date);
      const daysDiff = Math.floor((asOf - invoiceDate) / (1000 * 60 * 60 * 24));
      const outstanding = calculate.sub(
        calculate.sub(invoice.total, invoice.discount || 0),
        invoice.credit || 0
      );

      if (outstanding <= 0) return;

      totalOutstanding += outstanding;

      const invoiceData = {
        invoice: invoice._id,
        number: invoice.number,
        client: invoice.client,
        date: invoice.date,
        total: invoice.total,
        discount: invoice.discount || 0,
        credit: invoice.credit || 0,
        outstanding,
        daysPastDue: daysDiff,
      };

      if (daysDiff <= 30) {
        aging.current.push(invoiceData);
      } else if (daysDiff <= 60) {
        aging.days30.push(invoiceData);
      } else if (daysDiff <= 90) {
        aging.days60.push(invoiceData);
      } else if (daysDiff <= 120) {
        aging.days90.push(invoiceData);
      } else {
        aging.over120.push(invoiceData);
      }
    });

    const summary = {
      current: aging.current.reduce((sum, inv) => sum + inv.outstanding, 0),
      days30: aging.days30.reduce((sum, inv) => sum + inv.outstanding, 0),
      days60: aging.days60.reduce((sum, inv) => sum + inv.outstanding, 0),
      days90: aging.days90.reduce((sum, inv) => sum + inv.outstanding, 0),
      over120: aging.over120.reduce((sum, inv) => sum + inv.outstanding, 0),
      total: totalOutstanding,
    };

    return res.status(200).json({
      success: true,
      result: {
        asOfDate: asOf,
        summary,
        aging,
      },
      message: 'Accounts Receivable Aging report generated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to generate AR Aging report',
    });
  }
};

module.exports = arAging;
