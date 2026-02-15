const summary = async (Model, req, res) => {
  try {
    // Build query for filtered count
    let filterQuery = { removed: false };
    
    // Apply filter if provided
    if (req.query.filter) {
      try {
        const filterObj = JSON.parse(req.query.filter);
        filterQuery = { ...filterQuery, ...filterObj };
      } catch (e) {
        // If filter is not JSON, ignore it
      }
    }
    
    // Apply equal filter if provided
    if (req.query.equal) {
      try {
        const equalObj = JSON.parse(req.query.equal);
        filterQuery = { ...filterQuery, ...equalObj };
      } catch (e) {
        // If equal is not JSON, ignore it
      }
    }

    // Count documents with filter
    const countFilter = await Model.countDocuments(filterQuery);
    
    // Count all documents (without filter)
    const countAllDocs = await Model.countDocuments({ removed: false });

    return res.status(200).json({
      success: true,
      result: {
        total: countAllDocs,
        filtered: countFilter,
        countFilter,
        countAllDocs,
      },
      message: 'Successfully count all documents',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message || 'Error getting summary',
    });
  }
};

module.exports = summary;
