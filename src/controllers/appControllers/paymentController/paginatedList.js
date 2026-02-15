const mongoose = require('mongoose');
const Model = mongoose.model('Payment');

const paginatedList = async (req, res) => {
  const page = req.query.page || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;

  const { sortBy = 'created', sortValue = -1, filter, equal } = req.query;

  const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
  let fields = {};
  
  // Only add $or if we have fields to search and a search query
  if (fieldsArray.length > 0 && req.query.q) {
    fields.$or = [];
    for (const field of fieldsArray) {
      fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
    }
  }

  // Build query object
  const queryObj = {
    removed: false,
    ...fields,
  };

  // Add filter only if both filter and equal are provided
  if (filter && equal !== undefined && equal !== null && equal !== '') {
    // Convert to ObjectId if it's a valid ObjectId string
    // For Payment model, client field is ObjectId
    if (mongoose.Types.ObjectId.isValid(equal)) {
      queryObj[filter] = new mongoose.Types.ObjectId(equal);
      console.log(`✅ Payment filter: ${filter} = ObjectId(${equal})`);
    } else {
      queryObj[filter] = equal;
      console.log(`⚠️ Payment filter: ${filter} = ${equal} (not valid ObjectId)`);
    }
  } else {
    console.log(`📝 Payment query: No filter applied`);
  }
  
  console.log(`🔍 Payment queryObj:`, JSON.stringify({
    removed: queryObj.removed,
    [filter]: queryObj[filter] ? queryObj[filter].toString() : 'N/A'
  }, null, 2));

  // Query the database for a list of all results
  const resultsPromise = Model.find(queryObj)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortValue })
    .populate('client', 'name email phone')
    .populate('invoice', 'number year total')
    .populate('paymentMode', 'name')
    .populate('createdBy', 'name')
    .exec();

  // Counting the total documents
  const countPromise = Model.countDocuments(queryObj);

  const [result, count] = await Promise.all([resultsPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  const pagination = { page, pages, count };
  
  console.log(`📊 Payment query result: Found ${count} documents`);
  if (count === 0 && filter && equal) {
    // Debug: Check total payments and sample client IDs
    const totalPayments = await Model.countDocuments({ removed: false });
    const samplePayments = await Model.find({ removed: false })
      .select('client _id number')
      .limit(5)
      .lean();
    console.log(`🔍 Total payments in DB: ${totalPayments}`);
    console.log(`🔍 Sample payments:`, samplePayments.map(p => ({
      id: p._id,
      number: p.number,
      client: p.client ? p.client.toString() : 'null'
    })));
    console.log(`🔍 Searching for client: ${equal}`);
  }

  if (count > 0) {
    return res.status(200).json({
      success: true,
      result,
      pagination,
      message: 'Successfully found all documents',
    });
  } else {
    return res.status(203).json({
      success: true,
      result: [],
      pagination,
      message: 'Collection is Empty',
    });
  }
};

module.exports = paginatedList;
