const multer = require('multer');
const path = require('path');

// Configure in-memory storage buffer
const storage = multer.memoryStorage();

// Allowed file extensions and MIME types
const allowedExtensions = ['.pdf', '.docx'];
const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedExtensions.includes(ext) || allowedMimeTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    const error = new Error(
      'Invalid file type. Only PDF (.pdf) and Microsoft Word (.docx) documents are allowed.'
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

// 5 MB maximum file size limit
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter,
});

/**
 * Express middleware wrapper to catch Multer errors gracefully
 */
const handleUpload = (req, res, next) => {
  const uploadSingle = upload.single('resume');

  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File is too large. Maximum allowable file size is 5MB.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

module.exports = {
  upload,
  handleUpload,
};
