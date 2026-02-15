const mongoose = require('mongoose');
const Model = mongoose.model('Booking');

const paginatedList = async (req, res) => {
  const page = req.query.page || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;

  const { sortBy = 'created', sortValue = -1, filter, equal } = req.query;

  const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
  let fields = fieldsArray.length === 0 ? {} : { $or: [] };

  for (const field of fieldsArray) {
    fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
  }

  // Build query object
  const queryObj = {
    removed: false,
    ...fields,
  };

  // Only add filter if both filter and equal are provided
  if (filter && equal !== undefined && equal !== null && equal !== '') {
    // Use regex for partial match on string fields
    const schema = Model.schema;
    const fieldPath = schema.path(filter);
    
    if (fieldPath && fieldPath.instance === 'String') {
      // For string fields, use regex for partial match
      queryObj[filter] = { $regex: new RegExp(equal, 'i') };
    } else {
      // For other fields (ObjectId, Number, etc.), use exact match
      queryObj[filter] = equal;
    }
  }

  const resultsPromise = Model.find(queryObj)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortValue })
    .populate('client', 'name email phone')
    .populate('package', 'packageName destination price')
    .populate('supplier', 'name supplierType')
    .populate('createdBy', 'name')
    .exec();

  const countPromise = Model.countDocuments(queryObj);

  const [result, count] = await Promise.all([resultsPromise, countPromise]);
  const pages = Math.ceil(count / limit);
  const pagination = { page, pages, count };

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
