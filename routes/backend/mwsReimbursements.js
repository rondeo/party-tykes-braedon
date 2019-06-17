const express = require('express');
const router = express.Router();
const reimbursementsApi = require('./../../controllers/backend/mwsApis/mwsReimbursements');
const {ensureAuthenticated} = require('../../config/auth');

router.get('/get_reimbursements',ensureAuthenticated, reimbursementsApi.fetchAmazonReimbursements);

module.exports = router;