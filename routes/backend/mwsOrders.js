const express = require('express');
const router = express.Router();
const ordersApi = require('./../../controllers/backend/mwsApis/mwsOrders');
const { ensureAuthenticated } = require('../../config/auth');

router.get('/fetchOrders', ensureAuthenticated, ordersApi.fetchAmazonOrders)

module.exports = router;