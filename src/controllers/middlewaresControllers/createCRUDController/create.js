const create = async (Model, req, res) => {
  // Creating a new document in the collection
  req.body.removed = false;
  
  // If creating a Role and admin is logged in, set createdBy
  if (Model.modelName === 'Role' && req.admin && req.admin._id) {
    req.body.createdBy = req.admin._id;
  }
  
  const result = await new Model({
    ...req.body,
  }).save();

  // Returning successfull response
  return res.status(200).json({
    success: true,
    result,
    message: 'Successfully Created the document in Model ',
  });
};

module.exports = create;
