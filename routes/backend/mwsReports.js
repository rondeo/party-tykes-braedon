const express = require('express');
const router = express.Router();
const reportsApi = require('./../../controllers/backend/mwsApis/mwsReports');
const {ensureAuthenticated} = require('../../config/auth');

router.get('/fetch-amazon-reports',ensureAuthenticated, reportsApi.fetchAmazonReports);

module.exports = router;