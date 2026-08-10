const multer = require('multer');
const env = require('../config/env');

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'application/pdf', 'text/', 'application/json'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.azure.maxUploadBytes },
  fileFilter: (req, file, cb) => {
    const allowed = ALLOWED_MIME_PREFIXES.some((prefix) => file.mimetype.startsWith(prefix));
    if (!allowed) return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    return cb(null, true);
  },
});

module.exports = upload;
