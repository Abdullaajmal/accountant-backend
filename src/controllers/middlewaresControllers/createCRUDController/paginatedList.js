const paginatedList = async (Model, req, res) => {
  const mongoose = require('mongoose');
  const page = req.query.page || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;

  const { sortBy = 'enabled', sortValue = -1, filter, equal } = req.query;

  const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

  let fields;

  fields = fieldsArray.length === 0 ? {} : { $or: [] };

  for (const field of fieldsArray) {
    fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
  }

  // Build query object
  const queryObj = {
    removed: false,
    ...fields,
  };
  
  // Add filter only if both filter and equal are provided
  if (filter && equal !== undefined && equal !== null && equal !== '') {
    // Get the schema to check if the field is ObjectId
    const schema = Model.schema;
    const fieldPath = schema.path(filter);
    
    console.log(`🔍 Filter: ${filter}, Equal: ${equal}, FieldPath:`, fieldPath);
    
    // Special handling for Booking model - search in nested arrays
    if (Model.modelName === 'Booking') {
      const bookingSearchFields = ['ticketNumber', 'pnr', 'paxName'];
      if (bookingSearchFields.includes(filter)) {
        // Search in both top-level and nested flights array
        const orConditions = [
          { [filter]: { $regex: new RegExp(equal, 'i') } }, // Top-level field
        ];
        
        // Add nested array search conditions
        if (filter === 'ticketNumber') {
          orConditions.push({ 'flights.ticketNumber': { $regex: new RegExp(equal, 'i') } });
        } else if (filter === 'pnr') {
          orConditions.push({ 'flights.pnr': { $regex: new RegExp(equal, 'i') } });
        } else if (filter === 'paxName') {
          orConditions.push({ 'flights.paxName': { $regex: new RegExp(equal, 'i') } });
        }
        
        // If there's already a $or in queryObj (from fields search), we need to combine them with $and
        if (queryObj.$or && Array.isArray(queryObj.$or)) {
          // Combine existing $or with new $or using $and
          const existingOr = queryObj.$or;
          delete queryObj.$or;
          queryObj.$and = [
            { $or: existingOr },
            { $or: orConditions }
          ];
        } else {
          queryObj.$or = orConditions;
        }
        console.log(`✅ Booking search with nested arrays:`, JSON.stringify(queryObj, null, 2));
      } else {
        // For other Booking fields, use normal search
        queryObj[filter] = { $regex: new RegExp(equal, 'i') };
      }
    } else {
      // If field is ObjectId type, convert string to ObjectId
      if (fieldPath) {
        const fieldType = fieldPath.instance || fieldPath.constructor.name;
        console.log(`📋 Field type: ${fieldType}, Instance: ${fieldPath.instance}`);
        
        // Check if it's an ObjectId field (multiple ways to check)
        if (fieldPath.instance === 'ObjectID' || 
            fieldPath.instance === 'ObjectId' ||
            fieldType === 'ObjectId' ||
            (fieldPath.options && fieldPath.options.type && fieldPath.options.type.name === 'ObjectId')) {
          try {
            if (mongoose.Types.ObjectId.isValid(equal)) {
              const objectIdValue = new mongoose.Types.ObjectId(equal);
              queryObj[filter] = objectIdValue;
              console.log(`✅ Converted ${equal} to ObjectId:`, objectIdValue.toString());
              console.log(`✅ ObjectId type check:`, objectIdValue instanceof mongoose.Types.ObjectId);
            } else {
              console.log(`⚠️ Invalid ObjectId: ${equal}, using as string`);
              queryObj[filter] = { $regex: new RegExp(equal, 'i') };
            }
          } catch (error) {
            console.log(`❌ Error converting to ObjectId:`, error.message);
            queryObj[filter] = { $regex: new RegExp(equal, 'i') };
          }
        } else {
          // Use regex for case-insensitive string search
          queryObj[filter] = { $regex: new RegExp(equal, 'i') };
          console.log(`📝 Using filter as regex: ${filter} = ${equal}`);
        }
      } else {
        // Field path not found, try to detect if it might be ObjectId by checking model
        // For common ObjectId fields like client, invoice, etc.
        const commonObjectIdFields = ['client', 'invoice', 'supplier', 'package', 'account', 'paymentMode', 'createdBy'];
        if (commonObjectIdFields.includes(filter) && mongoose.Types.ObjectId.isValid(equal)) {
          queryObj[filter] = new mongoose.Types.ObjectId(equal);
          console.log(`✅ Auto-converted common ObjectId field ${filter} to ObjectId`);
        } else {
          // Use regex for case-insensitive string search
          queryObj[filter] = { $regex: new RegExp(equal, 'i') };
          console.log(`📝 Using filter as regex: ${filter} = ${equal}`);
        }
      }
    }
  }
  
  // Log query object (ObjectId will show as string in JSON, but it's actually ObjectId in query)
  const queryObjForLog = {};
  for (const key in queryObj) {
    if (queryObj[key] instanceof mongoose.Types.ObjectId) {
      queryObjForLog[key] = `ObjectId('${queryObj[key].toString()}')`;
    } else {
      queryObjForLog[key] = queryObj[key];
    }
  }
  console.log(`🔎 Final queryObj:`, JSON.stringify(queryObjForLog, null, 2));
  console.log(`🔍 Executing query with Model:`, Model.modelName);

  //  Query the database for a list of all results
  console.log(`🔍 Executing find query with:`, JSON.stringify(queryObjForLog, null, 2));
  const resultsPromise = Model.find(queryObj)
    .skip(skip)
    .limit(limit)
    .sort({ [sortBy]: sortValue })
    .populate()
    .exec();

  // Counting the total documents
  const countPromise = Model.countDocuments(queryObj);
  // Resolving both promises
  const [result, count] = await Promise.all([resultsPromise, countPromise]);
  
  console.log(`📊 Query result: Found ${count} documents, Returning ${result.length} items`);
  if (count === 0 && filter && equal) {
    // Debug: Check if any documents exist with this filter
    const allDocs = await Model.find({ removed: false }).limit(5).select(`${filter} _id`).lean();
    console.log(`🔍 Sample documents (first 5):`, allDocs);
    if (allDocs.length > 0) {
      console.log(`🔍 Sample ${filter} values:`, allDocs.map(doc => ({ id: doc._id, [filter]: doc[filter] })));
    }
  }

  // Calculating total pages
  const pages = Math.ceil(count / limit);

  // Getting Pagination Object
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
