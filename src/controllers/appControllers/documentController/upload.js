const mongoose = require('mongoose');
const Model = mongoose.model('Document');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../public/uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and office documents are allowed.'));
    }
  },
}).single('file');

const uploadDocument = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        result: null,
        message: err.message || 'File upload failed',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'No file uploaded',
      });
    }

    try {
      const { documentName, documentType, entity, entityModel, description, tags } = req.body;

      const document = new Model({
        documentName: documentName || req.file.originalname,
        documentType: documentType || 'other',
        entity: entity || null,
        entityModel: entityModel || null,
        file: {
          id: req.file.filename,
          name: req.file.originalname,
          path: `/uploads/documents/${req.file.filename}`,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
        description,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
        createdBy: req.admin._id,
      });

      await document.save();

      return res.status(200).json({
        success: true,
        result: document,
        message: 'Document uploaded successfully',
      });
    } catch (error) {
      // Delete uploaded file if document creation fails
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        result: null,
        message: error.message || 'Failed to save document',
      });
    }
  });
};

module.exports = uploadDocument;
