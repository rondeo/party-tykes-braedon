const express = require('express');
const router = express.Router();
const refundFunctions = require('./../../controllers/frontend/refundsManagement/index');
const frontauth = require('./../../config/frontauth');

router.get('/fetchRefunds', frontauth, refundFunctions.fetchRefunds);

module.exports = router;