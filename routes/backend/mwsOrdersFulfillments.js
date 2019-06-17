const express = require('express');
const router = express.Router();
const mwsOrdersFulfillments = require('./../../controllers/backend/mwsApis/mwsOrdersFulfillments');
const { ensureAuthenticated } = require('../../config/auth');

router.get('/fetchFulfillments', ensureAuthenticated, mwsOrdersFulfillments.fetchAmazonFulfillments)

module.exports = router;