const express = require('express');
const ctrl = require('../controllers/itemsController');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { cacheResponse } = require('../middleware/cache');

const router = express.Router();

router.use(requireAuth);
router.get('/', cacheResponse(30), ctrl.list);
router.post('/', ctrl.createValidators, validate, ctrl.create);
router.delete('/:id', ctrl.idValidators, validate, ctrl.remove);

module.exports = router;
