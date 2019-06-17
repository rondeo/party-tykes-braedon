const express = require('express');
const router = express.Router();
const inventoryApi = require('./../../controllers/backend/inventory/index');
const { ensureAuthenticated } = require('../../config/auth');

router.get('/afnData', ensureAuthenticated, inventoryApi.fetchAfnData);

module.exports = router;