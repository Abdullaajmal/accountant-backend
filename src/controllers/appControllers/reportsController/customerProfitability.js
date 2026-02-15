const mongoose = require('mongoose');
const Invoice = mongoose.model('Invoice');
const Payment = mongoose.model('Payment');
const Expense = mongoose.model('Expense');

const customerProfitability = async (req, res) => {
  try {
    const { startDate, endDate, companyId, branchId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Start date and end date are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const query = {
      date: { $gte: start, $lte: end },
      removed: false,
    };

    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;

    const invoices = await Invoice.find(query).populate('client').exec();
    const payments = await Payment.find(query).populate('client').exec();

    // Group by client
    const clientData = {};

    invoices.forEach((invoice) => {
      const clientId = invoice.client?._id?.toString() || 'unknown';
      if (!clientData[clientId]) {
        clientData[clientId] = {
          client: invoice.client,
          totalSales: 0,
          totalPayments: 0,
          invoiceCount: 0,
          paymentCount: 0,
        };
      }
      clientData[clientId].totalSales += invoice.total || 0;
      clientData[clientId].invoiceCount++;
    });

    payments.forEach((payment) => {
      const clientId = payment.client?._id?.toString() || 'unknown';
      if (!clientData[clientId]) {
        clientData[clientId] = {
          client: payment.client,
          totalSales: 0,
          totalPayments: 0,
          invoiceCount: 0,
          paymentCount: 0,
        };
      }
      clientData[clientId].totalPayments += payment.amount || 0;
      clientData[clientId].paymentCount++;
    });

    // Calculate profitability
    const profitability = Object.values(clientData).map((data) => {
      const profit = data.totalPayments - (data.totalSales * 0.7); // Assuming 30% margin
      const profitMargin = data.totalSales > 0 ? (profit / data.totalSales) * 100 : 0;

      return {
        ...data,
        profit,
        profitMargin: Math.round(profitMargin * 100) / 100,
      };
    });

    // Sort by profit
    profitability.sort((a, b) => b.profit - a.profit);

    return res.status(200).json({
      success: true,
      result: {
        period: { startDate, endDate },
        customers: profitability,
        summary: {
          totalCustomers: profitability.length,
          totalSales: profitability.reduce((sum, c) => sum + c.totalSales, 0),
          totalProfit: profitability.reduce((sum, c) => sum + c.profit, 0),
        },
      },
      message: 'Customer profitability report generated successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to generate customer profitability report',
    });
  }
};

module.exports = customerProfitability;
