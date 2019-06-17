const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAmazon } = require('../../config/auth');
const salesFunctions = require('./../../controllers/backend/sales/index');

router.get('/all-sales', ensureAuthenticated, salesFunctions.showAllSales);
router.post('/all-sales', ensureAuthenticated, salesFunctions.postshowAllSales);

module.exports = router;