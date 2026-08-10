const express = require('express');
const ctrl = require('../controllers/filesController');
const { requireAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(requireAuth);
router.get('/', ctrl.list);
router.post('/upload', uploadLimiter, upload.single('file'), ctrl.upload);
router.get('/:id', ctrl.download);
router.delete('/:id', ctrl.remove);

module.exports = router;
