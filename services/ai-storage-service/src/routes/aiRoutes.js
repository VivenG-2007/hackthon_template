const express = require('express');
const ctrl = require('../controllers/aiController');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(requireAuth, aiLimiter);
router.post('/chat', ctrl.chatValidators, validate, ctrl.chat);
router.post('/generate', ctrl.generate);
router.post('/analyze', ctrl.analyze);

module.exports = router;
