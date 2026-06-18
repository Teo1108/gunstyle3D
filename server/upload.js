const path = require('path');
const fs = require('fs');
const multer = require('multer');

function generateUniqueFilename(originalName) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '');
  return `${Date.now()}-${base}${ext}`;
}

function createUploadMiddleware(uploadsDir) {
  fs.mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, generateUniqueFilename(file.originalname)),
  });

  return multer({ storage });
}

module.exports = { createUploadMiddleware, generateUniqueFilename };
