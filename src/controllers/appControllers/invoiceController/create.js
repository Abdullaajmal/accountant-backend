const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const { calculate } = require('@/helpers');
const { increaseBySettingKey } = require('@/middlewares/settings');
const schema = require('./schemaValidate');

const create = async (req, res) => {
  let body = req.body;

  const { error, value } = schema.validate(body);
  if (error) {
    const { details } = error;
    return res.status(400).json({
      success: false,
      result: null,
      message: details[0]?.message,
    });
  }

  const { items = [], taxRate = 0, discount = 0, gstRate = 0, gstNumber } = value;

  // default
  let subTotal = 0;
  let taxTotal = 0;
  let gstAmount = 0;
  let total = 0;

  //Calculate the items array with subTotal, total, taxTotal
  items.map((item) => {
    let total = calculate.multiply(item['quantity'], item['price']);
    //sub total
    subTotal = calculate.add(subTotal, total);
    //item total
    item['total'] = total;
  });
  
  // Calculate Tax (VAT/Sales Tax)
  taxTotal = calculate.multiply(subTotal, taxRate / 100);
  
  // Calculate GST (Goods and Services Tax) on subtotal
  gstAmount = calculate.multiply(subTotal, gstRate / 100);
  
  // Total = SubTotal + Tax + GST - Discount
  total = calculate.add(subTotal, taxTotal);
  total = calculate.add(total, gstAmount);
  total = calculate.sub(total, discount);

  body['subTotal'] = subTotal;
  body['taxTotal'] = taxTotal;
  body['gstRate'] = gstRate;
  body['gstAmount'] = gstAmount;
  if (gstNumber) {
    body['gstNumber'] = gstNumber;
  }
  body['total'] = total;
  body['items'] = items;

  let paymentStatus = calculate.sub(total, discount) === 0 ? 'paid' : 'unpaid';

  body['paymentStatus'] = paymentStatus;
  body['createdBy'] = req.admin._id;

  // Creating a new document in the collection
  const result = await new Model(body).save();
  const fileId = 'invoice-' + result._id + '.pdf';
  const updateResult = await Model.findOneAndUpdate(
    { _id: result._id },
    { pdf: fileId },
    {
      new: true,
    }
  ).exec();
  // Returning successfull response

  increaseBySettingKey({
    settingKey: 'last_invoice_number',
  });

  // Auto-create journal entry for invoice
  try {
    const { createInvoiceJournalEntry } = require('@/helpers/autoJournalEntry');
    await createInvoiceJournalEntry(updateResult, req.admin._id);
  } catch (error) {
    console.error('Error creating auto journal entry for invoice:', error);
    // Don't fail the invoice creation if journal entry fails
  }

  // Create audit log
  try {
    const { createAuditLog } = require('@/middlewares/auditLog');
    await createAuditLog(req, 'create', 'invoice', updateResult._id, { total: updateResult.total });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }

  // Returning successfull response
  return res.status(200).json({
    success: true,
    result: updateResult,
    message: 'Invoice created successfully',
  });
};

module.exports = create;
