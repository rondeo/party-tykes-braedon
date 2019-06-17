const express = require('express');
const router = express.Router();
const refundsApi = require('./../../controllers/backend/mwsApis/mwsRefunds');
const {ensureAuthenticated} = require('../../config/auth');

router.get('/fetch-amazon-refunds',ensureAuthenticated, refundsApi.fetchAmazonRefunds);

module.exports = router;