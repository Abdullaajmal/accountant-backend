const mongoose = require('mongoose');
const Model = mongoose.model('Document');

const linkToEntity = async (req, res) => {
  try {
    const { id } = req.params;
    const { entity, entityModel } = req.body;

    if (!entity || !entityModel) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Entity and entity model are required',
      });
    }

    const document = await Model.findOneAndUpdate(
      { _id: id, removed: false },
      {
        $set: {
          entity,
          entityModel,
        },
      },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found',
      });
    }

    return res.status(200).json({
      success: true,
      result: document,
      message: 'Document linked to entity successfully',
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message || 'Failed to link document',
    });
  }
};

module.exports = linkToEntity;
